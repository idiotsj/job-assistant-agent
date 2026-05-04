import type { ScheduleItem } from "@job-assistant/contracts/schedule";

import type {
  ScheduleDayGroup,
  ScheduleFormState,
  ScheduleSourceCount,
  ScheduleSummaryCard,
  ScheduleTimelineMode,
  ScheduleViewState,
} from "./types";

export const initialScheduleFormState: ScheduleFormState = {
  title: "",
  startAt: "",
  endAt: "",
  city: "",
  description: "",
};

export function sortTimeline(items: ScheduleItem[]) {
  return [...items].sort((left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime());
}

export function toLocalDateTimeInput(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 16);
}

export function toIsoDateTime(value: string) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

export function formatDayLabel(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date(value));
}

export function formatTimeRange(item: ScheduleItem) {
  const formatter = new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const start = formatter.format(new Date(item.startAt));

  if (!item.endAt) {
    return start;
  }

  return `${start} - ${formatter.format(new Date(item.endAt))}`;
}

export function getSourceLabel(source: ScheduleItem["source"]) {
  switch (source) {
    case "job":
      return "岗位节点";
    case "event":
      return "活动日程";
    case "exam":
      return "考试提醒";
    case "user":
      return "我的安排";
    default:
      return "时间线";
  }
}

export function getSourceTone(source: ScheduleItem["source"]) {
  switch (source) {
    case "job":
      return "info" as const;
    case "event":
      return "neutral" as const;
    case "exam":
      return "warning" as const;
    case "user":
      return "success" as const;
    default:
      return "neutral" as const;
  }
}

export function groupTimeline(items: ScheduleItem[]): ScheduleDayGroup[] {
  const grouped = new Map<string, ScheduleItem[]>();

  for (const item of items) {
    const key = new Date(item.startAt).toISOString().slice(0, 10);
    const currentItems = grouped.get(key) ?? [];
    currentItems.push(item);
    grouped.set(key, currentItems);
  }

  return [...grouped.entries()].map(([dateKey, dayItems]) => ({
    dateKey,
    label: formatDayLabel(dayItems[0]?.startAt ?? dateKey),
    items: dayItems,
  }));
}

export function getScheduleSourceCount(timeline: ScheduleItem[]): ScheduleSourceCount {
  return {
    user: timeline.filter((item) => item.source === "user").length,
    job: timeline.filter((item) => item.source === "job").length,
    event: timeline.filter((item) => item.source === "event").length,
    exam: timeline.filter((item) => item.source === "exam").length,
  };
}

export function buildScheduleSummaryCards(
  upcomingItem: ScheduleItem | null,
  sourceCount: ScheduleSourceCount,
): ScheduleSummaryCard[] {
  return [
    {
      label: "下一条节点",
      value: upcomingItem ? upcomingItem.title : "暂无时间线内容",
      description: upcomingItem
        ? `${formatDayLabel(upcomingItem.startAt)} · ${formatTimeRange(upcomingItem)}`
        : "新用户或空画像下，时间线可能为空。",
    },
    {
      label: "可编辑事项",
      value: sourceCount.user,
      description: "仅自定义日程允许编辑和删除，聚合项只展示来源信息。",
    },
    {
      label: "求职节点",
      value: sourceCount.job + sourceCount.event,
      description: "岗位截止和活动时间统一收束在这里，不再分散查找。",
    },
    {
      label: "考试提醒",
      value: sourceCount.exam,
      description: "升学或考公相关提醒以独立考试来源进入时间线，不混入首页主推荐流。",
    },
  ];
}

export function createDraftItem(id: string, form: ScheduleFormState): ScheduleItem {
  return {
    id,
    title: form.title.trim(),
    source: "user",
    startAt: toIsoDateTime(form.startAt) ?? new Date().toISOString(),
    endAt: toIsoDateTime(form.endAt),
    city: form.city.trim() || null,
    description: form.description.trim(),
  };
}

export function getScheduleViewState({
  mode,
  timeline,
  errorMessage,
}: {
  mode: ScheduleTimelineMode;
  timeline: ScheduleItem[];
  errorMessage: string;
}): ScheduleViewState {
  if (errorMessage && timeline.length === 0) {
    return "error";
  }

  if (timeline.length === 0) {
    return mode === "live" ? "empty-live" : "empty-demo";
  }

  return mode === "live" ? "ready-live" : "ready-demo";
}
