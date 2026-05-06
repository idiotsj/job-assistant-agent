import type { UserProfile } from "@job-assistant/contracts/profile";
import type { ScheduleItem } from "@job-assistant/contracts/schedule";

import type {
  ProfileSessionStatus,
  ProfileStageTask,
  ProfileSuggestionGroup,
  ProfileSummaryItem,
  ProfileViewState,
} from "./types";

export const suggestedIndustries = ["AI 产品", "互联网平台", "企业服务", "新消费", "教育科技"];
export const suggestedCities = ["上海", "杭州", "深圳", "北京", "广州"];
export const suggestedJobTypes = ["前端开发", "产品经理", "运营分析", "数据分析", "用户研究"];
export const suggestedSkills = ["React", "TypeScript", "Python", "SQL", "Figma", "用户研究"];

export function createEmptyProfile(userId: string): UserProfile {
  return {
    userId,
    university: "",
    major: "",
    grade: "",
    targetIndustries: [],
    targetCities: [],
    skills: [],
    preferredJobTypes: [],
    considersPostgraduate: false,
    considersCivilService: false,
    resumeData: null,
  };
}

export function getProfileViewState({
  sessionStatus,
  profile,
  loading,
  errorMessage,
}: {
  sessionStatus: ProfileSessionStatus;
  profile: UserProfile | null;
  loading: boolean;
  errorMessage: string;
}): ProfileViewState {
  if (sessionStatus === "loading") {
    return "loading";
  }

  if (sessionStatus !== "authenticated") {
    return "unauthenticated";
  }

  if (profile) {
    return "ready-live";
  }

  if (loading && !profile) {
    return "loading";
  }

  return errorMessage ? "error" : "loading";
}

export function getProfileCompleteness(profile: UserProfile) {
  return (
    Number(Boolean(profile.university)) +
    Number(Boolean(profile.major)) +
    Number(Boolean(profile.grade)) +
    Number(profile.targetCities.length > 0) +
    Number(profile.targetIndustries.length > 0) +
    Number(profile.preferredJobTypes.length > 0) +
    Number(profile.skills.length > 0)
  );
}

export function buildProfileSummaryItems(profile: UserProfile): ProfileSummaryItem[] {
  return [
    {
      label: "基础信息",
      value: `${profile.university || "待补学校"} / ${profile.major || "待补专业"} / ${profile.grade || "待补年级"}`,
    },
    {
      label: "目标方向",
      value: profile.preferredJobTypes.join(" / ") || "尚未设定意向岗位",
    },
    {
      label: "目标城市",
      value: profile.targetCities.join(" / ") || "尚未设定目标城市",
    },
  ];
}

export function buildProfileSuggestionGroups(): ProfileSuggestionGroup[] {
  return [
    {
      label: "推荐行业",
      field: "targetIndustries",
      items: suggestedIndustries,
    },
    {
      label: "推荐城市",
      field: "targetCities",
      items: suggestedCities,
    },
    {
      label: "推荐岗位",
      field: "preferredJobTypes",
      items: suggestedJobTypes,
    },
    {
      label: "推荐技能",
      field: "skills",
      items: suggestedSkills,
    },
  ];
}

export function buildProfileTags(profile: UserProfile): string[] {
  const tags = [
    profile.grade,
    ...profile.preferredJobTypes.slice(0, 2),
    ...profile.targetCities.slice(0, 2),
  ].filter(Boolean);

  return [...new Set(tags)];
}

export function getProfileReadinessLabel(completeness: number, total: number) {
  const ratio = completeness / total;

  if (ratio >= 0.85) {
    return "画像已进入稳定可用阶段";
  }

  if (ratio >= 0.55) {
    return "画像可用，但仍建议补强关键字段";
  }

  return "画像仍处于基础补全阶段";
}

export function buildProfileStageTask(profile: UserProfile, completeness: number, total: number): ProfileStageTask {
  if (completeness <= 4) {
    return {
      stageLabel: "当前阶段主任务",
      title: "先把画像补到可稳定驱动推荐的程度",
      explanation:
        "你的基础资料已经可以继续编辑，但首页推荐、岗位匹配和频道建议仍然会受到关键字段缺失的影响。先把岗位、城市和技能补稳，再继续推进其他动作更划算。",
      primaryActionLabel: "继续完善画像",
      primaryActionHref: "/profile",
      secondaryActionLabel: "去首页看当前状态",
      secondaryActionHref: "/",
      benefitTips: ["推荐结果更贴近真实目标", "后续频道建议不再发散", "减少重复补资料的成本"],
    };
  }

  if (!profile.resumeData) {
    return {
      stageLabel: "当前阶段主任务",
      title: "画像已成型，下一步把简历诊断接上",
      explanation:
        "你已经有了较完整的目标方向与技能信息，现在最值得补上的不是继续堆标签，而是把简历送进真实诊断链路，让画像和简历开始形成闭环。",
      primaryActionLabel: "去做简历体检",
      primaryActionHref: "/resume",
      secondaryActionLabel: "继续微调画像",
      secondaryActionHref: "/profile",
      benefitTips: ["拿到最新简历缓存", "让岗位分析有更稳的基础", "补齐行动链路而不是只停留在资料页"],
    };
  }

  if (profile.considersPostgraduate || profile.considersCivilService) {
    return {
      stageLabel: "当前阶段主任务",
      title: "把升学 / 考公意向和职业路线一起收口",
      explanation:
        "你的画像已经不再只是求职画像。建议现在去对应频道看阶段建议，同时保留求职路径，避免后续判断时再次分裂成两套方向。",
      primaryActionLabel: profile.considersPostgraduate ? "去看考研频道" : "去看考公频道",
      primaryActionHref: profile.considersPostgraduate ? "/postgraduate" : "/civil-service",
      secondaryActionLabel: "继续看岗位机会",
      secondaryActionHref: "/jobs",
      benefitTips: ["双路径信息不再分散", "阶段建议更聚焦", "方便后续统一安排时间线"],
    };
  }

  return {
    stageLabel: "当前阶段主任务",
    title: "画像和简历已具备基础，下一步把岗位路线收紧",
    explanation:
      "目前你的基础资料已经足够驱动首页和岗位推荐。接下来更值得做的是回到岗位页或首页，判断哪些机会要进入正式投递节奏，而不是继续停留在资料维护。",
    primaryActionLabel: "去看就业广场",
    primaryActionHref: "/jobs",
    secondaryActionLabel: "回首页看主任务",
    secondaryActionHref: "/",
    benefitTips: ["减少信息收集式停留", "把资料页转成行动页", "让画像真正服务投递路线"],
  };
}

export function buildProfileFocusCards(profile: UserProfile, completeness: number, total: number) {
  return [
    {
      label: "画像完成度",
      value: `${completeness}/${total}`,
      description: getProfileReadinessLabel(completeness, total),
    },
    {
      label: "目标岗位",
      value: profile.preferredJobTypes.slice(0, 2).join(" / ") || "待补意向岗位",
      description: "优先决定你最想进入的 1 到 2 条路线，后续推荐才更稳定。",
    },
    {
      label: "目标城市",
      value: profile.targetCities.slice(0, 2).join(" / ") || "待补目标城市",
      description: "城市会直接影响岗位、活动和时间线聚合范围。",
    },
    {
      label: "简历状态",
      value: profile.resumeData ? "已有缓存" : "待首次诊断",
      description: profile.resumeData
        ? "可以继续进入岗位分析或复核最近一次简历体检结果。"
        : "建议尽快把简历接入诊断，形成完整个人中心闭环。",
    },
  ];
}

export function buildProfileWeeklyFocus(profile: UserProfile): string[] {
  return [
    profile.preferredJobTypes.length > 0
      ? `本周优先围绕“${profile.preferredJobTypes[0]}”整理岗位判断与简历表达。`
      : "本周先补齐目标岗位字段，再进入更有意义的推荐判断。",
    profile.targetCities.length > 0
      ? `重点留意 ${profile.targetCities.slice(0, 2).join(" / ")} 的岗位与活动时间线。`
      : "目标城市仍未明确，首页与岗位页的机会范围会偏宽。",
    profile.resumeData
      ? "简历缓存已存在，可以直接去岗位详情页做更细的适配分析。"
      : "简历缓存为空，建议尽快完成一次体检，避免后续每个模块都缺少基础输入。",
  ];
}

export function sortProfileTimeline(items: ScheduleItem[]) {
  return [...items].sort((left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime());
}

export function buildProfileTimelinePreview(items: ScheduleItem[]) {
  return sortProfileTimeline(items).slice(0, 3);
}

export function getProfileTimelineLabel(item: ScheduleItem) {
  const sourceLabel =
    item.source === "job"
      ? "岗位节点"
      : item.source === "event"
        ? "活动提醒"
        : item.source === "exam"
          ? "考试提醒"
          : "我的安排";

  const dateLabel = new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(item.startAt));

  return `${sourceLabel} · ${dateLabel}${item.city ? ` · ${item.city}` : ""}`;
}
