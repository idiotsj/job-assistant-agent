import type { ScheduleItem } from "@job-assistant/contracts/schedule";

import type {
  HomeModuleModes,
  HomeOverallMode,
  HomeSessionStatus,
  HomeViewState,
} from "./types";

export function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "早安";
  }

  if (hour < 18) {
    return "下午好";
  }

  return "晚上好";
}

export function formatCompactDate(value: string | null | undefined) {
  if (!value) {
    return "长期开放";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
  }).format(new Date(value));
}

export function formatTimelineDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function getScheduleSourceLabel(source: ScheduleItem["source"]) {
  switch (source) {
    case "job":
      return "岗位提醒";
    case "event":
      return "活动提醒";
    case "exam":
      return "考试提醒";
    default:
      return "我的日程";
  }
}

export function summarizeHomeModes(modes: HomeModuleModes) {
  const totalSectionCount = Object.keys(modes).length;
  const liveSectionCount = Object.values(modes).filter((mode) => mode === "live").length;

  let overallMode: HomeOverallMode = "demo";

  if (liveSectionCount === totalSectionCount) {
    overallMode = "live";
  } else if (liveSectionCount > 0) {
    overallMode = "mixed";
  }

  return {
    liveSectionCount,
    totalSectionCount,
    overallMode,
  };
}

export function getHomeViewState(
  sessionStatus: HomeSessionStatus,
  overallMode: HomeOverallMode,
  errorMessage: string,
): HomeViewState {
  if (sessionStatus === "loading") {
    return "loading";
  }

  if (sessionStatus === "unauthenticated") {
    return "unauthenticated";
  }

  if (errorMessage && overallMode === "demo") {
    return "error";
  }

  if (overallMode === "live") {
    return "ready-live";
  }

  if (overallMode === "mixed") {
    return "partial-live";
  }

  return "ready-demo";
}
