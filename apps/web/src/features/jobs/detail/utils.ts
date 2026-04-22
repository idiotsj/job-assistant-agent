import type { Job } from "@job-assistant/contracts/jobs";

import type { JobDetailLinkItem, JobDetailMetaItem, JobDetailSourceMode, JobDetailViewState } from "./types";

export function formatJobDateTime(value: string | null) {
  if (!value) {
    return "长期开放";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatJobDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
  }).format(new Date(value));
}

export function createJobInsight(job: Job) {
  if (job.requiredSkills.length > 0) {
    return `优先把 ${job.requiredSkills.slice(0, 2).join(" / ")} 这组关键词和对应项目结果显式放进简历摘要，会更容易让这条岗位的分析结果变稳。`;
  }

  return "建议先把岗位标题、摘要和最强项目做更强的一致化，再进入抽屉查看岗位分析。";
}

export function buildJobTimeItems(job: Job): JobDetailMetaItem[] {
  return [
    {
      label: "发布时间",
      value: formatJobDate(job.publishedAt),
    },
    {
      label: "截止时间",
      value: formatJobDateTime(job.deadline),
    },
    {
      label: "工作地点",
      value: job.workLocation,
    },
  ];
}

export function buildJobReminders(job: Job) {
  return [
    "先保证简历标题、摘要与岗位方向一致。",
    `至少拿一个项目经历去映射这份岗位的核心技能要求${job.requiredSkills.length > 0 ? `，优先围绕 ${job.requiredSkills.slice(0, 2).join(" / ")}` : ""}。`,
    "如果准备投递，建议先打开抽屉做一次岗位定向分析，再决定是否进一步改写简历。",
  ];
}

export function buildJobContinueLinks(job: Job): JobDetailLinkItem[] {
  return [
    {
      href: "/jobs",
      label: "回岗位列表",
      tone: "secondary",
    },
    {
      href: "/events",
      label: "看近期活动",
      tone: "secondary",
    },
    {
      href: "/schedule",
      label: "去安排日程",
      tone: "primary",
    },
    {
      href: `/companies/${job.companyId}`,
      label: "查看企业详情",
      tone: "secondary",
    },
  ];
}

export function getJobDetailViewState({
  job,
  mode,
  loading,
  errorMessage,
  notFound,
}: {
  job: Job | null;
  mode: JobDetailSourceMode;
  loading: boolean;
  errorMessage: string;
  notFound: boolean;
}): JobDetailViewState {
  if (loading && !job) {
    return "loading";
  }

  if (notFound) {
    return "not-found";
  }

  if (!job) {
    return errorMessage ? "error" : "loading";
  }

  return mode === "live" ? "ready-live" : "ready-demo";
}
