import type { Job, JobResumeAnalyzeResult, JobResumeRewriteSection, JobResumeRewriteSuggestionsResult } from "@job-assistant/contracts/jobs";
import type { AiTask, AiTaskStatus } from "@job-assistant/contracts/ai-tasks";

import { ApiError } from "@/lib/api/client";
import { formatUserFacingError } from "@/lib/errors";

import type {
  AdoptedRewriteSuggestion,
  JobDrawerSkillRow,
  JobDrawerSourceLabel,
  JobDrawerSourceMode,
  JobDrawerViewState,
} from "./types";

export const rewriteSectionLabels: Record<JobResumeRewriteSection["section"], string> = {
  headline: "标题",
  summary: "摘要",
  skills: "技能区",
  project: "项目经历",
  experience: "实习经历",
};

export function normalizeSkillMatches(job: Job, analysis: JobResumeAnalyzeResult): JobDrawerSkillRow[] {
  return job.requiredSkills.slice(0, 5).map((skill) => {
    const normalizedSkill = skill.toLowerCase();
    const matched = analysis.parsed.detectedSkills.some((candidate) => {
      const normalizedCandidate = candidate.toLowerCase();
      return normalizedCandidate.includes(normalizedSkill) || normalizedSkill.includes(normalizedCandidate);
    });

    return {
      skill,
      score: matched ? 92 : 48,
      copy: matched ? "简历已覆盖，可继续补结果证据" : "建议在项目经历里显式补齐这个关键词",
    };
  });
}

export function verdictTone(verdict: JobResumeAnalyzeResult["analysis"]["verdict"]) {
  if (verdict === "strong_match") {
    return "success" as const;
  }

  if (verdict === "partial_match") {
    return "info" as const;
  }

  return "warning" as const;
}

export function getVerdictLabel(verdict: JobResumeAnalyzeResult["analysis"]["verdict"]) {
  if (verdict === "strong_match") {
    return "强匹配";
  }

  if (verdict === "partial_match") {
    return "部分匹配";
  }

  return "弱匹配";
}

export function getSourceLabel(
  analysisMode: JobDrawerSourceMode,
  rewriteMode: JobDrawerSourceMode,
): JobDrawerSourceLabel {
  if (analysisMode === "live" && rewriteMode === "live") {
    return "live";
  }

  if (analysisMode === "demo" && rewriteMode === "demo") {
    return "demo";
  }

  return "mixed";
}

export function getViewState(
  sessionStatus: "loading" | "authenticated" | "unauthenticated",
  analysisMode: JobDrawerSourceMode,
  rewriteMode: JobDrawerSourceMode,
  resultStale: boolean,
): JobDrawerViewState {
  if (sessionStatus === "loading") {
    return "loading";
  }

  if (sessionStatus !== "authenticated") {
    return "unauthenticated";
  }

  if (resultStale && (analysisMode === "live" || rewriteMode === "live")) {
    return "stale-live";
  }

  if (analysisMode === "live" && rewriteMode === "live") {
    return "ready-live";
  }

  if (analysisMode === "live" || rewriteMode === "live") {
    return "partial-live";
  }

  return "ready-demo";
}

export function getSuggestionKey(suggestion: JobResumeRewriteSection) {
  return [suggestion.section, suggestion.currentIssue, suggestion.suggestedText].join("::");
}

export function buildAdoptedSuggestions(
  rewrite: JobResumeRewriteSuggestionsResult,
  adoptedSuggestionKeys: string[],
): AdoptedRewriteSuggestion[] {
  const adoptedSet = new Set(adoptedSuggestionKeys);

  return rewrite.rewriteSuggestions.sectionSuggestions
    .filter((suggestion) => adoptedSet.has(getSuggestionKey(suggestion)))
    .map((suggestion) => ({
      ...suggestion,
      key: getSuggestionKey(suggestion),
    }));
}

export function buildActionChecklist(analysis: JobResumeAnalyzeResult, rewrite: JobResumeRewriteSuggestionsResult) {
  return Array.from(
    new Set([
      analysis.analysis.actionPlan.topPriority,
      ...analysis.analysis.actionPlan.nextSteps,
      ...rewrite.rewriteSuggestions.actionChecklist,
    ]),
  );
}

export function buildAdoptedSuggestionsText(adoptedSuggestions: AdoptedRewriteSuggestion[]) {
  return adoptedSuggestions
    .map((suggestion, index) => {
      return `${index + 1}. 【${rewriteSectionLabels[suggestion.section]}】${suggestion.suggestedText}`;
    })
    .join("\n");
}

export function getJobAnalysisActionError(error: unknown, target: "analysis" | "rewrite") {
  if (error instanceof ApiError && error.status === 401) {
    return "当前登录状态已失效，请重新登录后再同步岗位分析。";
  }

  if (error instanceof ApiError && error.status === 404) {
    return "这个岗位不存在，或当前已经下线。";
  }

  if (error instanceof ApiError && error.status === 503) {
    return target === "analysis"
      ? "真实岗位分析暂时不可用，当前先保留演示分析结果。"
      : "改写建议服务暂时不可用，当前先保留演示建议。";
  }

  return formatUserFacingError(
    error,
    target === "analysis" ? "岗位分析没有成功，请稍后再试。" : "改写建议没有成功，请稍后再试。",
  );
}

export function getAiTaskStatusLabel(status: "idle" | AiTaskStatus) {
  switch (status) {
    case "idle":
      return "尚未创建异步任务";
    case "pending":
      return "任务已创建，正在排队";
    case "running":
      return "任务执行中";
    case "succeeded":
      return "任务已完成";
    case "failed":
      return "任务执行失败";
    case "cancelled":
      return "任务已取消";
    default:
      return "任务状态未知";
  }
}

export function getAiTaskPendingMessage(task: AiTask, channel: "idle" | "websocket" | "polling") {
  const progress = task.progress;
  if (progress?.message) {
    return `${progress.message}${channel === "polling" ? "，当前已自动切到轮询刷新。" : ""}`;
  }

  if (task.status === "pending") {
    return channel === "polling"
      ? "改写建议任务已创建，正在排队，当前已自动切到轮询刷新。"
      : "改写建议任务已创建，正在排队。";
  }

  return channel === "polling"
    ? "改写建议任务执行中，当前已自动切到轮询刷新。"
    : "改写建议任务执行中，完成后会自动刷新结果。";
}

export function getAiTaskFailureMessage(task: AiTask) {
  const errorCode = task.error?.code ?? "TASK_EXECUTION_FAILED";

  if (errorCode === "UNAUTHORIZED") {
    return "当前登录状态已失效，请重新登录后再发起改写建议任务。";
  }

  if (errorCode === "JOB_NOT_FOUND" || errorCode === "NOT_FOUND") {
    return "这个岗位不存在，或当前已经下线。";
  }

  if (
    errorCode === "AI_SERVICE_UNAVAILABLE" ||
    errorCode === "TASK_STORE_UNAVAILABLE" ||
    errorCode === "WORKER_TIMEOUT"
  ) {
    return "改写建议依赖服务暂时不可用，请稍后重试。";
  }

  return task.error?.message || "改写建议任务没有成功，请稍后再试。";
}

export async function copyTextToClipboard(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  if (typeof document === "undefined") {
    return false;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";

  document.body.append(textarea);
  textarea.select();

  const copied = document.execCommand("copy");
  textarea.remove();

  return copied;
}
