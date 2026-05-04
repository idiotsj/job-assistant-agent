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

export function buildHomeStageTask(options: {
  profileComplete: boolean;
  topRecommendationTitle: string | null;
  featuredJobTitle: string | null;
  timelineTitle: string | null;
}) {
  if (!options.profileComplete) {
    return {
      stageLabel: "当前阶段",
      title: "先补齐职业画像，稳定你的首页推荐",
      explanation:
        "你的首页已经可以继续使用，但目标岗位、城市和技能标签还不够完整。先把画像补齐，再让岗位推荐、企业推荐和日程提醒真正围绕你来工作。",
      benefitTips: ["首页推荐更贴近真实偏好", "岗位对齐结果更稳定", "后续频道建议更容易聚焦"],
      primaryActionHref: "/profile",
      primaryActionLabel: "去完善画像",
      secondaryActionHref: "/resume",
      secondaryActionLabel: "先做简历体检",
    };
  }

  if (options.featuredJobTitle) {
    return {
      stageLabel: "今日主任务",
      title: `优先判断“${options.featuredJobTitle}”是否进入本周重点投递`,
      explanation:
        "首页已经拿到你的实时岗位与时间线。现在最值得做的不是继续泛看信息，而是先把这条精选岗位判断清楚，再决定是否进入正式投递准备。",
      benefitTips: ["先看高优先级机会", "减少无差别海投", "让时间线跟着真实目标走"],
      primaryActionHref: "/jobs",
      primaryActionLabel: "去看岗位对齐",
      secondaryActionHref: "/schedule",
      secondaryActionLabel: "同步我的时间线",
    };
  }

  if (options.topRecommendationTitle) {
    return {
      stageLabel: "当前阶段",
      title: `围绕“${options.topRecommendationTitle}”整理一次投递准备`,
      explanation:
        "当前没有额外精选岗位也没关系。你已经有较强的推荐结果，建议先围绕这条岗位梳理简历表达、项目亮点和下一步投递动作。",
      benefitTips: ["优先处理高契合推荐", "把简历改成结果导向", "让推荐流和简历动作闭环"],
      primaryActionHref: "/jobs",
      primaryActionLabel: "查看推荐岗位",
      secondaryActionHref: "/resume",
      secondaryActionLabel: "去做简历诊断",
    };
  }

  return {
    stageLabel: options.timelineTitle ? "近期提醒" : "当前阶段",
    title: options.timelineTitle
      ? `先跟进“${options.timelineTitle}”，别让关键节点悄悄溜走`
      : "先从简历体检和画像校准开始，重新点亮首页主线",
    explanation: options.timelineTitle
      ? "当前岗位和活动推荐还在积累中，但你已经有明确的时间节点。先把最近的一条安排处理好，再回来继续刷新推荐。"
      : "如果首页还没有足够强的推荐信号，先检查画像和简历。把基础信息补稳后，首页更容易进入真实的任务推进节奏。",
    benefitTips: ["先处理最近节点", "减少临期慌乱", "把首页从浏览页变成行动页"],
    primaryActionHref: "/schedule",
    primaryActionLabel: "打开时间线",
    secondaryActionHref: "/profile",
    secondaryActionLabel: "回到画像页",
  };
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
