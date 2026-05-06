import type { FormEvent } from "react";
import type { UserProfile } from "@job-assistant/contracts/profile";
import type { ScheduleItem } from "@job-assistant/contracts/schedule";

export type ProfileSessionStatus = "loading" | "authenticated" | "unauthenticated";
export type ProfileViewState = "loading" | "unauthenticated" | "ready-live" | "error";

export type ProfileTextField = "university" | "major" | "grade";
export type ProfileTagField = "targetIndustries" | "targetCities" | "skills" | "preferredJobTypes";
export type ProfileFlagField = "considersPostgraduate" | "considersCivilService";

export interface ProfileSummaryItem {
  label: string;
  value: string;
}

export interface ProfileSuggestionGroup {
  label: string;
  field: ProfileTagField;
  items: string[];
}

export interface ProfileStageTask {
  stageLabel: string;
  title: string;
  explanation: string;
  primaryActionLabel: string;
  primaryActionHref: string;
  secondaryActionLabel: string;
  secondaryActionHref: string;
  benefitTips: string[];
}

export interface ProfilePageData {
  currentProfile: UserProfile | null;
  displayUserLabel: string;
  completeness: number;
  completenessTotal: number;
  summaryItems: ProfileSummaryItem[];
  suggestionGroups: ProfileSuggestionGroup[];
  hasResumeCache: boolean;
  stageTask: ProfileStageTask | null;
  profileTags: string[];
  focusCards: Array<{
    label: string;
    value: string;
    description: string;
  }>;
  timelinePreview: ScheduleItem[];
  weeklyFocus: string[];
  profileReadinessLabel: string;
}

export interface ProfilePageStatus {
  sessionStatus: ProfileSessionStatus;
  viewState: ProfileViewState;
  loading: boolean;
  saving: boolean;
  message: string;
  errorMessage: string;
}

export interface ProfilePageActions {
  syncProfile: () => Promise<void>;
  updateTextField: (field: ProfileTextField, value: string) => void;
  updateTagField: (field: ProfileTagField, nextValue: string[]) => void;
  appendSuggestedTag: (field: ProfileTagField, value: string) => void;
  toggleFlagField: (field: ProfileFlagField) => void;
  saveProfile: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}
