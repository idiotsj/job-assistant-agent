import type { FormEvent } from "react";
import type { UserProfile } from "@job-assistant/contracts/profile";

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

export interface ProfilePageData {
  currentProfile: UserProfile | null;
  displayUserLabel: string;
  completeness: number;
  completenessTotal: number;
  summaryItems: ProfileSummaryItem[];
  suggestionGroups: ProfileSuggestionGroup[];
  hasResumeCache: boolean;
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
