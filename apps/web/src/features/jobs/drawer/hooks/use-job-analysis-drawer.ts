"use client";

import type { AiTaskStatus } from "@job-assistant/contracts/ai-tasks";
import type { Job, JobResumeRewriteSuggestionsResult } from "@job-assistant/contracts/jobs";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";

import { useAuthSession } from "@/components/providers/auth-provider";
import { demoJobAnalysis, demoJobRewriteSuggestions, demoResumeText } from "@/features/shared/demo-data";
import {
  createJobResumeRewriteTask,
  findLatestAiTaskForJob,
  getAiTask,
  listAiTasks,
  subscribeAiTaskUpdates,
} from "@/lib/api/ai-tasks";
import { analyzeJobResume } from "@/lib/api/jobs";

import type { JobAnalysisDrawerActions, JobAnalysisDrawerData, JobAnalysisDrawerStatus } from "../types";
import {
  buildActionChecklist,
  buildAdoptedSuggestions,
  buildAdoptedSuggestionsText,
  copyTextToClipboard,
  getAiTaskFailureMessage,
  getAiTaskPendingMessage,
  getJobAnalysisActionError,
  getSourceLabel,
  getViewState,
  normalizeSkillMatches,
} from "../utils";

interface JobAnalysisDrawerController {
  data: JobAnalysisDrawerData;
  status: JobAnalysisDrawerStatus;
  actions: JobAnalysisDrawerActions;
}

const initialMessage = "当前先展示结构预览；登录后可切到真实岗位分析，并通过异步任务拿到改写建议。";
const terminalTaskStatuses = new Set<AiTaskStatus>(["succeeded", "failed", "cancelled"]);

function isRewriteTaskResult(result: unknown): result is JobResumeRewriteSuggestionsResult {
  return Boolean(result && typeof result === "object" && "rewriteSuggestions" in result);
}

export function useJobAnalysisDrawer(job: Job | null): JobAnalysisDrawerController {
  const { status: sessionStatus } = useAuthSession();
  const [rawText, setRawText] = useState(demoResumeText);
  const [analysis, setAnalysis] = useState(demoJobAnalysis);
  const [rewrite, setRewrite] = useState(demoJobRewriteSuggestions);
  const [analysisMode, setAnalysisMode] = useState<"demo" | "live">("demo");
  const [rewriteMode, setRewriteMode] = useState<"demo" | "live">("demo");
  const [actionStatus, setActionStatus] = useState<"idle" | "creating" | "analyzing" | "copying">("idle");
  const [message, setMessage] = useState(initialMessage);
  const [messageTone, setMessageTone] = useState<"info" | "success">("info");
  const [errorMessage, setErrorMessage] = useState("");
  const [resultStale, setResultStale] = useState(false);
  const [adoptedSuggestionKeys, setAdoptedSuggestionKeys] = useState<string[]>([]);
  const [copiedTarget, setCopiedTarget] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [rewriteTaskStatus, setRewriteTaskStatus] = useState<"idle" | AiTaskStatus>("idle");
  const [taskChannel, setTaskChannel] = useState<"idle" | "websocket" | "polling">("idle");

  const pollTimerRef = useRef<number | null>(null);
  const subscriptionRef = useRef<{ close: () => void } | null>(null);
  const rewriteTaskStatusRef = useRef<"idle" | AiTaskStatus>("idle");

  const skillRows = useMemo(() => (job ? normalizeSkillMatches(job, analysis) : []), [analysis, job]);
  const adoptedSuggestions = useMemo(
    () => buildAdoptedSuggestions(rewrite, adoptedSuggestionKeys),
    [adoptedSuggestionKeys, rewrite],
  );
  const sourceLabel = getSourceLabel(analysisMode, rewriteMode);
  const actionChecklist = useMemo(() => buildActionChecklist(analysis, rewrite), [analysis, rewrite]);

  function clearTaskWatcher() {
    if (pollTimerRef.current !== null) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    if (subscriptionRef.current) {
      subscriptionRef.current.close();
      subscriptionRef.current = null;
    }
  }

  function resetTaskState() {
    clearTaskWatcher();
    setActiveTaskId(null);
    setRewriteTaskStatus("idle");
    rewriteTaskStatusRef.current = "idle";
    setTaskChannel("idle");
  }

  async function refreshTask(taskId: string) {
    const task = await getAiTask(taskId);
    const taskResult = task.result;

    startTransition(() => {
      setActiveTaskId(task.id);
      setRewriteTaskStatus(task.status);
    });
    rewriteTaskStatusRef.current = task.status;

    if (task.status === "succeeded" && isRewriteTaskResult(taskResult)) {
      startTransition(() => {
        setRewrite(taskResult);
        setRewriteMode("live");
        setResultStale(false);
        setMessage("改写建议异步任务已完成，当前结果已刷新为真实建议。");
        setMessageTone("success");
        setErrorMessage("");
        setAdoptedSuggestionKeys([]);
        setCopiedTarget(null);
      });
      clearTaskWatcher();
      setTaskChannel("idle");
      return task;
    }

    if (task.status === "failed" || task.status === "cancelled") {
      startTransition(() => {
        setRewrite(demoJobRewriteSuggestions);
        setRewriteMode("demo");
        setMessage("");
        setErrorMessage(getAiTaskFailureMessage(task));
      });
      clearTaskWatcher();
      setTaskChannel("idle");
      return task;
    }

    startTransition(() => {
      setMessage(getAiTaskPendingMessage(task, taskChannel === "idle" ? "polling" : taskChannel));
      setMessageTone("info");
      setErrorMessage("");
    });

    return task;
  }

  function schedulePolling(taskId: string, delayMs = 1500) {
    if (pollTimerRef.current !== null) {
      window.clearTimeout(pollTimerRef.current);
    }

    pollTimerRef.current = window.setTimeout(async () => {
      try {
        const task = await refreshTask(taskId);
        if (!task || terminalTaskStatuses.has(task.status)) {
          return;
        }
        schedulePolling(taskId);
      } catch (error) {
        startTransition(() => {
          setErrorMessage(getJobAnalysisActionError(error, "rewrite"));
          setMessage("改写建议任务状态暂时没同步到，当前先保留已有结果。");
          setMessageTone("info");
        });
      }
    }, delayMs);
  }

  function startTaskMonitoring(taskId: string) {
    clearTaskWatcher();
    setActiveTaskId(taskId);
    setTaskChannel("websocket");

    const subscription = subscribeAiTaskUpdates({
      taskIds: [taskId],
      onUpdated: (event) => {
        startTransition(() => {
          setRewriteTaskStatus(event.status);
          setMessage(
            event.progress?.message ??
              (event.status === "pending" ? "改写建议任务已创建，正在排队。" : "改写建议任务执行中。"),
          );
          setMessageTone("info");
        });
        rewriteTaskStatusRef.current = event.status;

        if (terminalTaskStatuses.has(event.status)) {
          void refreshTask(taskId);
        }
      },
      onError: () => {
        subscriptionRef.current?.close();
        subscriptionRef.current = null;
        startTransition(() => {
          setTaskChannel("polling");
        });
        schedulePolling(taskId, 500);
      },
      onClose: () => {
        if (rewriteTaskStatusRef.current !== "idle" && terminalTaskStatuses.has(rewriteTaskStatusRef.current)) {
          return;
        }

        startTransition(() => {
          setTaskChannel("polling");
        });
        schedulePolling(taskId, 500);
      },
    });

    subscriptionRef.current = subscription;
  }

  useEffect(() => {
    return () => {
      clearTaskWatcher();
    };
  }, []);

  useEffect(() => {
    if (!copiedTarget) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setCopiedTarget(null);
    }, 1800);

    return () => window.clearTimeout(timeout);
  }, [copiedTarget]);

  useEffect(() => {
    if (!job) {
      return;
    }

    resetTaskState();
    setRawText(demoResumeText);
    setAnalysis(demoJobAnalysis);
    setRewrite(demoJobRewriteSuggestions);
    setAnalysisMode("demo");
    setRewriteMode("demo");
    setActionStatus("idle");
    setMessage(`已切换到 ${job.title} 的分析抽屉，当前先展示结构预览。`);
    setMessageTone("info");
    setErrorMessage("");
    setResultStale(false);
    setAdoptedSuggestionKeys([]);
    setCopiedTarget(null);
  }, [job?.id]);

  useEffect(() => {
    async function recoverTask() {
      if (!job || sessionStatus !== "authenticated") {
        return;
      }

      try {
        const tasks = await listAiTasks({
          capability: "job_resume_rewrite",
          limit: 20,
        });
        const latestTask = findLatestAiTaskForJob(tasks, job.id);
        if (!latestTask) {
          return;
        }

        const latestTaskDetails = await refreshTask(latestTask.id);
        if (!latestTaskDetails || terminalTaskStatuses.has(latestTaskDetails.status)) {
          return;
        }

        startTaskMonitoring(latestTask.id);
      } catch {
        // Silent recovery failure: the drawer can still work through fresh task creation.
      }
    }

    void recoverTask();
  }, [job?.id, sessionStatus]);

  function updateRawText(nextValue: string) {
    const changed = rawText !== nextValue;
    const hasLiveResult = analysisMode === "live" || rewriteMode === "live";

    setRawText(nextValue);
    setErrorMessage("");

    if (!changed) {
      return;
    }

    if (hasLiveResult) {
      setResultStale(true);

      if (!resultStale) {
        setMessage("简历原文已更新，当前 live 分析和改写建议对应的是旧文本，请重新运行。");
        setMessageTone("info");
      }

      return;
    }

    setMessage("");
  }

  function ensureCanRun() {
    setErrorMessage("");

    if (!job) {
      setMessage("");
      setErrorMessage("当前没有可分析的岗位。");
      return false;
    }

    if (!rawText.trim()) {
      setMessage("");
      setErrorMessage("请先粘贴简历纯文本，再开始岗位分析。");
      return false;
    }

    if (sessionStatus === "loading") {
      setMessage("");
      setErrorMessage("正在检查当前登录状态，请稍候片刻再试。");
      return false;
    }

    if (sessionStatus !== "authenticated") {
      setMessage("");
      setErrorMessage("登录后才能进行真实岗位分析。当前保留的是演示结构预览。");
      return false;
    }

    return true;
  }

  async function handleAnalyze() {
    if (!job || !ensureCanRun()) {
      return;
    }

    setActionStatus("analyzing");
    setMessage("");
    setErrorMessage("");

    try {
      const analysisResult = await analyzeJobResume(job.id, { rawText, fileName: "resume.txt" });

      startTransition(() => {
        setAnalysis(analysisResult);
        setAnalysisMode("live");
        setResultStale(false);
        setAdoptedSuggestionKeys([]);
        setCopiedTarget(null);
      });
    } catch (error) {
      startTransition(() => {
        setAnalysis(demoJobAnalysis);
        setAnalysisMode("demo");
        setErrorMessage(getJobAnalysisActionError(error, "analysis"));
      });
      setActionStatus("idle");
      return;
    }

    setActionStatus("creating");

    try {
      const task = await createJobResumeRewriteTask(job.id, { rawText, fileName: "resume.txt" });

      startTransition(() => {
        setActiveTaskId(task.taskId);
        setRewriteTaskStatus(task.status);
        setRewrite(demoJobRewriteSuggestions);
        setRewriteMode("demo");
        setTaskChannel("websocket");
        setMessage("真实岗位分析已完成，改写建议任务已创建，正在等待结果。");
        setMessageTone("success");
        setErrorMessage("");
      });
      rewriteTaskStatusRef.current = task.status;

      startTaskMonitoring(task.taskId);
    } catch (error) {
      startTransition(() => {
        setRewrite(demoJobRewriteSuggestions);
        setRewriteMode("demo");
        setRewriteTaskStatus("idle");
        setTaskChannel("idle");
        setMessage("已拿到真实岗位分析结果；改写建议任务暂时没创建成功。");
        setMessageTone("success");
        setErrorMessage(getJobAnalysisActionError(error, "rewrite"));
      });
    } finally {
      setActionStatus("idle");
    }
  }

  function resetToDemo() {
    resetTaskState();
    setRawText(demoResumeText);
    setAnalysis(demoJobAnalysis);
    setRewrite(demoJobRewriteSuggestions);
    setAnalysisMode("demo");
    setRewriteMode("demo");
    setActionStatus("idle");
    setMessage("已回到演示预览状态，方便继续看结构和交互。");
    setMessageTone("info");
    setErrorMessage("");
    setResultStale(false);
    setAdoptedSuggestionKeys([]);
    setCopiedTarget(null);
  }

  function adoptSuggestion(key: string) {
    setAdoptedSuggestionKeys((current) => {
      if (current.includes(key)) {
        return current;
      }

      return [...current, key];
    });
    setMessage("已把建议加入当前采纳预览；这不会自动写回简历或画像。");
    setMessageTone("info");
  }

  function removeAdoptedSuggestion(key: string) {
    setAdoptedSuggestionKeys((current) => current.filter((item) => item !== key));
    setMessage("已从采纳预览中移除这条建议。");
    setMessageTone("info");
  }

  function clearAdoptedSuggestions() {
    setAdoptedSuggestionKeys([]);
    setMessage("已清空当前采纳预览。");
    setMessageTone("info");
  }

  async function copyText(target: string, text: string, successMessage: string) {
    setActionStatus("copying");

    try {
      const copied = await copyTextToClipboard(text);

      startTransition(() => {
        setActionStatus("idle");

        if (!copied) {
          setErrorMessage("当前环境无法直接复制，请手动复制这段文案。");
          return;
        }

        setCopiedTarget(target);
        setMessage(successMessage);
        setMessageTone("success");
      });
    } catch {
      startTransition(() => {
        setActionStatus("idle");
        setErrorMessage("复制失败了，请手动复制这段文案。");
      });
    }
  }

  async function copyAdoptedSuggestions() {
    if (adoptedSuggestions.length === 0) {
      return;
    }

    await copyText(
      "adopted",
      buildAdoptedSuggestionsText(adoptedSuggestions),
      "已复制当前采纳预览，可粘贴到你的简历编辑器里继续细修。",
    );
  }

  async function copyStandaloneText(target: "headline" | "summary", text: string) {
    await copyText(
      target,
      text,
      target === "headline" ? "已复制标题建议。" : "已复制摘要建议。",
    );
  }

  async function copySuggestion(key: string, text: string) {
    await copyText(`suggestion:${key}`, text, "已复制这条建议句。");
  }

  return {
    data: {
      job,
      rawText,
      analysis,
      rewrite,
      analysisMode,
      rewriteMode,
      sourceLabel,
      skillRows,
      adoptedSuggestions,
      actionChecklist,
    },
    status: {
      sessionStatus,
      actionStatus,
      rewriteTaskStatus,
      activeTaskId,
      taskChannel,
      message,
      messageTone,
      errorMessage,
      resultStale,
      viewState: getViewState(sessionStatus, analysisMode, rewriteMode, resultStale),
      copiedTarget,
    },
    actions: {
      updateRawText,
      handleAnalyze,
      resetToDemo,
      adoptSuggestion,
      removeAdoptedSuggestion,
      clearAdoptedSuggestions,
      copyAdoptedSuggestions,
      copyStandaloneText,
      copySuggestion,
    },
  };
}
