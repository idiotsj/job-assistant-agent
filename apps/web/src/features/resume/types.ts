import type { ProfileResumeDiagnoseResult, ProfileResumeParseResult } from "@job-assistant/contracts/profile";

export type ResumeSourceMode = "demo" | "live";
export type ResumeMessageTone = "info" | "success";
export type ResumeActionStatus = "idle" | "importing" | "parsing" | "diagnosing";
export type ResumeViewState =
  | "loading"
  | "unauthenticated"
  | "ready-demo"
  | "ready-live"
  | "stale-live";

export interface ResumeWorkbenchData {
  rawText: string;
  parseResult: ProfileResumeParseResult;
  diagnosisResult: ProfileResumeDiagnoseResult;
  parseSnapshot: ProfileResumeParseResult;
  parseMode: ResumeSourceMode;
  diagnosisMode: ResumeSourceMode;
  parseSnapshotMode: ResumeSourceMode;
  patchEntries: Array<[string, unknown]>;
}

export interface ResumeWorkbenchStatus {
  sessionStatus: "loading" | "authenticated" | "unauthenticated";
  actionStatus: ResumeActionStatus;
  message: string;
  messageTone: ResumeMessageTone;
  errorMessage: string;
  resultStale: boolean;
  viewState: ResumeViewState;
}

export interface ResumeWorkbenchActions {
  updateRawText: (nextValue: string) => void;
  importTextFile: (file: File | null) => Promise<void>;
  handleParse: () => Promise<void>;
  handleDiagnose: () => Promise<void>;
  resetToDemo: () => void;
  loadDemoResume: () => void;
}
