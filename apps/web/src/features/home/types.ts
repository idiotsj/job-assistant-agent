import type { AuthUser } from "@job-assistant/contracts/auth";
import type { Company } from "@job-assistant/contracts/companies";
import type { TodayContent } from "@job-assistant/contracts/daily-content";
import type { UserProfile } from "@job-assistant/contracts/profile";
import type { HomeRecommendation } from "@job-assistant/contracts/recommendation";
import type { ScheduleItem } from "@job-assistant/contracts/schedule";

export type HomeSourceMode = "demo" | "live";
export type HomeOverallMode = "demo" | "mixed" | "live";
export type HomeMessageTone = "info" | "success";
export type HomeSessionStatus = "loading" | "authenticated" | "unauthenticated";
export type HomeSyncStatus = "idle" | "loading";
export type HomeSyncReason = "auto" | "manual";
export type HomeQuickLinkId =
  | "profile"
  | "jobs"
  | "interview"
  | "cases"
  | "postgraduate"
  | "civil-service";
export type HomeViewState =
  | "loading"
  | "ready-demo"
  | "ready-live"
  | "partial-live"
  | "unauthenticated"
  | "error";

export interface HomeModuleModes {
  profile: HomeSourceMode;
  recommendation: HomeSourceMode;
  todayContent: HomeSourceMode;
  schedule: HomeSourceMode;
}

export interface HomeDashboardState {
  profile: UserProfile;
  recommendation: HomeRecommendation;
  todayContent: TodayContent;
  schedule: ScheduleItem[];
  modes: HomeModuleModes;
}

export interface HomeDashboardData {
  displayUser: AuthUser;
  profile: UserProfile;
  recommendation: HomeRecommendation;
  todayContent: TodayContent;
  timelinePreview: ScheduleItem[];
  schedule: ScheduleItem[];
  heroAdvice: TodayContent["dailyAdvice"];
  featuredCompany: Company | null;
  featuredJobs: TodayContent["featuredJobs"];
  topRecommendation: HomeRecommendation["jobs"][number] | null;
  actionChecklist: string[];
  profileNeedsAttention: boolean;
  stageTask: {
    stageLabel: string;
    title: string;
    explanation: string;
    benefitTips: string[];
    primaryActionHref: string;
    primaryActionLabel: string;
    secondaryActionHref: string;
    secondaryActionLabel: string;
  };
  quickLinks: Array<{
    id: HomeQuickLinkId;
    label: string;
    description: string;
    href: string;
  }>;
  spotlightJobs: HomeRecommendation["jobs"];
  featuredEvents: HomeRecommendation["events"];
  insightHighlights: Array<{
    id: string;
    title: string;
    body: string;
    href?: string;
    actionLabel?: string;
  }>;
}

export interface HomeDashboardStatus {
  sessionStatus: HomeSessionStatus;
  syncStatus: HomeSyncStatus;
  message: string;
  messageTone: HomeMessageTone;
  errorMessage: string;
  overallMode: HomeOverallMode;
  liveSectionCount: number;
  totalSectionCount: number;
  viewState: HomeViewState;
  modes: HomeModuleModes;
}

export interface HomeDashboardController {
  data: HomeDashboardData;
  status: HomeDashboardStatus;
  actions: {
    syncDashboard: (reason?: HomeSyncReason) => Promise<void>;
  };
}
