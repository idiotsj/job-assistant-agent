import type { FormEvent } from "react";
import type { ScheduleItem } from "@job-assistant/contracts/schedule";

export type ScheduleTimelineMode = "demo" | "live";
export type ScheduleViewState = "ready-demo" | "ready-live" | "empty-demo" | "empty-live" | "error";

export interface ScheduleFormState {
  title: string;
  startAt: string;
  endAt: string;
  city: string;
  description: string;
}

export interface ScheduleSourceCount {
  user: number;
  job: number;
  event: number;
  exam: number;
}

export interface ScheduleDayGroup {
  dateKey: string;
  label: string;
  items: ScheduleItem[];
}

export interface ScheduleSummaryCard {
  label: string;
  value: string | number;
  description: string;
}

export interface SchedulePageData {
  mode: ScheduleTimelineMode;
  timeline: ScheduleItem[];
  groupedTimeline: ScheduleDayGroup[];
  upcomingItem: ScheduleItem | null;
  sourceCount: ScheduleSourceCount;
  summaryCards: ScheduleSummaryCard[];
  editingId: string | null;
  form: ScheduleFormState;
}

export interface SchedulePageStatus {
  sessionStatus: "loading" | "authenticated" | "unauthenticated";
  viewState: ScheduleViewState;
  loading: boolean;
  submitting: boolean;
  message: string;
  errorMessage: string;
}

export interface SchedulePageActions {
  syncTimeline: () => Promise<void>;
  editItem: (item: ScheduleItem) => void;
  deleteItem: (item: ScheduleItem) => Promise<void>;
  updateFormField: (field: keyof ScheduleFormState, value: string) => void;
  submitForm: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  resetComposer: () => void;
}
