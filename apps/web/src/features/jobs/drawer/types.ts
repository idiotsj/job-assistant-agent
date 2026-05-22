import type { Job, JobResumeAnalyzeResult, JobResumeRewriteSection, JobResumeRewriteSuggestionsResult } from "@job-assistant/contracts/jobs";
import type { AiTaskStatus } from "@job-assistant/contracts/ai-tasks";

export type JobDrawerSourceMode = "demo" | "live";
export type JobDrawerSourceLabel = "demo" | "live" | "mixed";
export type JobDrawerMessageTone = "info" | "success";
export type JobDrawerActionStatus = "idle" | "creating" | "analyzing" | "copying";
export type JobDrawerViewState =
  | "loading"
  | "unauthenticated"
  | "ready-demo"
  | "ready-live"
  | "partial-live"
  | "stale-live";

export interface JobDrawerSkillRow {
  skill: string;
  score: number;
  copy: string;
}

export interface AdoptedRewriteSuggestion extends JobResumeRewriteSection {
  key: string;
}

export interface JobAnalysisDrawerData {
  job: Job | null;
  rawText: string;
  analysis: JobResumeAnalyzeResult;
  rewrite: JobResumeRewriteSuggestionsResult;
  analysisMode: JobDrawerSourceMode;
  rewriteMode: JobDrawerSourceMode;
  sourceLabel: JobDrawerSourceLabel;
  skillRows: JobDrawerSkillRow[];
  adoptedSuggestions: AdoptedRewriteSuggestion[];
  actionChecklist: string[];
}

export interface JobAnalysisDrawerStatus {
  sessionStatus: "loading" | "authenticated" | "unauthenticated";
  actionStatus: JobDrawerActionStatus;
  rewriteTaskStatus: "idle" | AiTaskStatus;
  activeTaskId: string | null;
  taskChannel: "idle" | "websocket" | "polling";
  message: string;
  messageTone: JobDrawerMessageTone;
  errorMessage: string;
  resultStale: boolean;
  viewState: JobDrawerViewState;
  copiedTarget: string | null;
}

export interface JobAnalysisDrawerActions {
  updateRawText: (nextValue: string) => void;
  handleAnalyze: () => Promise<void>;
  resetToDemo: () => void;
  adoptSuggestion: (key: string) => void;
  removeAdoptedSuggestion: (key: string) => void;
  clearAdoptedSuggestions: () => void;
  copyAdoptedSuggestions: () => Promise<void>;
  copyStandaloneText: (target: "headline" | "summary", text: string) => Promise<void>;
  copySuggestion: (key: string, text: string) => Promise<void>;
}
