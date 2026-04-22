import type { Job, JobListQuery } from "@job-assistant/contracts/jobs";

export type JobsSourceMode = "demo" | "live";
export type JobsViewState = "loading" | "ready-demo" | "ready-live" | "empty-demo" | "empty-live" | "error";

export interface JobsPagePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface JobsPageResponse {
  success: true;
  data: Job[];
  pagination: JobsPagePagination;
}

export interface JobsSummaryCard {
  label: string;
  value: number | string;
  description: string;
}

export interface JobsPageData {
  filters: JobListQuery;
  appliedFilters: JobListQuery;
  response: JobsPageResponse;
  mode: JobsSourceMode;
  summaryCards: JobsSummaryCard[];
  cityOptions: readonly string[];
  industryOptions: readonly string[];
}

export interface JobsPageStatus {
  loading: boolean;
  message: string;
  errorMessage: string;
  viewState: JobsViewState;
}

export interface JobsPageActions {
  updateKeyword: (value: string) => void;
  selectCity: (value: string) => void;
  selectIndustry: (value: string) => void;
  toggleFeaturedOnly: () => void;
  applyFilters: () => void;
  resetFilters: () => void;
  resetToDemo: () => void;
  goToPage: (page: number) => void;
  syncLive: () => Promise<void>;
}
