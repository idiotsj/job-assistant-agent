"use client";

import type { Job } from "@job-assistant/contracts/jobs";
import { startTransition, useEffect, useMemo, useState } from "react";

import { useAuthSession } from "@/components/providers/auth-provider";
import { demoJobAnalysis, demoJobRewriteSuggestions, demoResumeText } from "@/features/shared/demo-data";
import { analyzeJobResume, getJobResumeRewriteSuggestions } from "@/lib/api/jobs";

import type { JobAnalysisDrawerActions, JobAnalysisDrawerData, JobAnalysisDrawerStatus } from "../types";
import {
  buildActionChecklist,
  buildAdoptedSuggestions,
  buildAdoptedSuggestionsText,
  copyTextToClipboard,
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

const initialMessage = "当前先展示结构预览；登录后可把岗位分析和改写建议切到真实接口结果。";

export function useJobAnalysisDrawer(job: Job | null): JobAnalysisDrawerController {
  const { status: sessionStatus } = useAuthSession();
  const [rawText, setRawText] = useState(demoResumeText);
  const [analysis, setAnalysis] = useState(demoJobAnalysis);
  const [rewrite, setRewrite] = useState(demoJobRewriteSuggestions);
  const [analysisMode, setAnalysisMode] = useState<"demo" | "live">("demo");
  const [rewriteMode, setRewriteMode] = useState<"demo" | "live">("demo");
  const [actionStatus, setActionStatus] = useState<"idle" | "analyzing" | "copying">("idle");
  const [message, setMessage] = useState(initialMessage);
  const [messageTone, setMessageTone] = useState<"info" | "success">("info");
  const [errorMessage, setErrorMessage] = useState("");
  const [resultStale, setResultStale] = useState(false);
  const [adoptedSuggestionKeys, setAdoptedSuggestionKeys] = useState<string[]>([]);
  const [copiedTarget, setCopiedTarget] = useState<string | null>(null);

  const skillRows = useMemo(() => (job ? normalizeSkillMatches(job, analysis) : []), [analysis, job]);
  const adoptedSuggestions = useMemo(
    () => buildAdoptedSuggestions(rewrite, adoptedSuggestionKeys),
    [adoptedSuggestionKeys, rewrite],
  );
  const sourceLabel = getSourceLabel(analysisMode, rewriteMode);
  const actionChecklist = useMemo(() => buildActionChecklist(analysis, rewrite), [analysis, rewrite]);

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

    const [analysisResult, rewriteResult] = await Promise.allSettled([
      analyzeJobResume(job.id, { rawText, fileName: "resume.txt" }),
      getJobResumeRewriteSuggestions(job.id, { rawText, fileName: "resume.txt" }),
    ]);

    const analysisSucceeded = analysisResult.status === "fulfilled";
    const rewriteSucceeded = rewriteResult.status === "fulfilled";
    const errors: string[] = [];

    if (!analysisSucceeded) {
      errors.push(getJobAnalysisActionError(analysisResult.reason, "analysis"));
    }

    if (!rewriteSucceeded) {
      errors.push(getJobAnalysisActionError(rewriteResult.reason, "rewrite"));
    }

    startTransition(() => {
      setAnalysis(analysisSucceeded ? analysisResult.value : demoJobAnalysis);
      setRewrite(rewriteSucceeded ? rewriteResult.value : demoJobRewriteSuggestions);
      setAnalysisMode(analysisSucceeded ? "live" : "demo");
      setRewriteMode(rewriteSucceeded ? "live" : "demo");
      setActionStatus("idle");
      setResultStale(false);
      setAdoptedSuggestionKeys([]);
      setCopiedTarget(null);

      if (analysisSucceeded && rewriteSucceeded) {
        setMessage("岗位分析和改写建议都已切换到真实结果。");
        setMessageTone("success");
        setErrorMessage("");
        return;
      }

      if (analysisSucceeded || rewriteSucceeded) {
        setMessage(
          analysisSucceeded
            ? "已拿到真实岗位分析结果；改写建议暂时保留演示内容。"
            : "已拿到真实改写建议；岗位分析暂时保留演示内容。",
        );
        setMessageTone("success");
        setErrorMessage(errors.join(" "));
        return;
      }

      setMessage("");
      setMessageTone("info");
      setErrorMessage(errors.join(" "));
    });
  }

  function resetToDemo() {
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

    await copyText("adopted", buildAdoptedSuggestionsText(adoptedSuggestions), "已复制当前采纳预览，可粘贴到你的简历编辑器里继续细修。");
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
