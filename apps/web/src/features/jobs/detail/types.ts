import type { Job } from "@job-assistant/contracts/jobs";

export type JobDetailSourceMode = "demo" | "live";
export type JobDetailViewState = "loading" | "ready-demo" | "ready-live" | "error" | "not-found";

export interface JobDetailMetaItem {
  label: string;
  value: string;
}

export interface JobDetailLinkItem {
  href: string;
  label: string;
  tone: "primary" | "secondary";
}

export interface JobDetailData {
  job: Job | null;
  mode: JobDetailSourceMode;
  insight: string;
  timeItems: JobDetailMetaItem[];
  reminders: string[];
  continueLinks: JobDetailLinkItem[];
}

export interface JobDetailStatus {
  sessionStatus: "loading" | "authenticated" | "unauthenticated";
  loading: boolean;
  message: string;
  errorMessage: string;
  notFound: boolean;
  drawerOpen: boolean;
  viewState: JobDetailViewState;
}

export interface JobDetailActions {
  syncLiveJob: () => Promise<void>;
  openDrawer: () => void;
  closeDrawer: () => void;
}
