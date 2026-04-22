import type { UserProfile } from "@job-assistant/contracts/profile";

import type { ProfileSessionStatus, ProfileSuggestionGroup, ProfileSummaryItem, ProfileViewState } from "./types";

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
