import type { ProfileResumeParseResult } from "@job-assistant/contracts/profile";

import { ApiError } from "@/lib/api/client";
import { formatUserFacingError } from "@/lib/errors";
import { demoResumeDiagnosis } from "@/features/shared/demo-data";

import type { ResumeSourceMode, ResumeViewState } from "./types";

export const demoResumeParseResult: ProfileResumeParseResult = {
  parsed: demoResumeDiagnosis.parsed,
  appliedPatch: demoResumeDiagnosis.appliedPatch,
  profile: demoResumeDiagnosis.profile,
};

export const profileFieldLabels: Record<string, string> = {
  university: "院校",
  major: "专业",
  grade: "年级",
  targetIndustries: "目标行业",
  targetCities: "目标城市",
  skills: "技能标签",
  preferredJobTypes: "目标岗位",
  considersPostgraduate: "考研意向",
  considersCivilService: "考公意向",
  resumeData: "简历结构化结果",
};

export function formatConfidence(value: number) {
  const percentage = value <= 1 ? Math.round(value * 100) : Math.round(value);
  return `${percentage}%`;
}

export function hasRenderableValue(value: unknown) {
  if (typeof value === "boolean") {
    return true;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>).length > 0;
  }

  return value !== null && value !== undefined && String(value).trim() !== "";
}

export function formatPatchValue(value: unknown) {
  if (typeof value === "boolean") {
    return value ? "是" : "否";
  }

  if (Array.isArray(value)) {
    return value.join(" · ");
  }

  if (value && typeof value === "object") {
    return "已更新为最新解析结果";
  }

  return String(value);
}

export function getPatchEntries(appliedPatch: Record<string, unknown>) {
  return Object.entries(appliedPatch).filter(([, value]) => hasRenderableValue(value));
}

export function getResumeActionError(error: unknown, action: "parse" | "diagnose") {
  if (error instanceof ApiError && error.status === 401) {
    return "当前登录状态已失效，请重新登录后再继续简历解析或 AI 体检。";
  }

  if (error instanceof ApiError && error.status === 503) {
    return "AI 简历服务暂时不可用，请稍后再试。";
  }

  return formatUserFacingError(
    error,
    action === "parse" ? "这次结构解析没有成功，请稍后再试。" : "这次 AI 体检没有成功，请稍后再试。",
  );
}

export function isSupportedResumeTextFile(file: File) {
  const normalizedName = file.name.toLowerCase();
  return (
    file.type.startsWith("text/") ||
    normalizedName.endsWith(".txt") ||
    normalizedName.endsWith(".md") ||
    normalizedName.endsWith(".markdown")
  );
}

export function getResumeViewState(
  sessionStatus: "loading" | "authenticated" | "unauthenticated",
  parseSnapshotMode: ResumeSourceMode,
  diagnosisMode: ResumeSourceMode,
  resultStale: boolean,
): ResumeViewState {
  if (sessionStatus === "loading") {
    return "loading";
  }

  if (sessionStatus !== "authenticated") {
    return "unauthenticated";
  }

  if (resultStale && (parseSnapshotMode === "live" || diagnosisMode === "live")) {
    return "stale-live";
  }

  if (parseSnapshotMode === "live" || diagnosisMode === "live") {
    return "ready-live";
  }

  return "ready-demo";
}
