import type { Job, JobResumeAnalyzeResult, JobResumeRewriteSection, JobResumeRewriteSuggestionsResult } from "@job-assistant/contracts/jobs";

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
