import { z } from "zod";

export const interviewPracticeStatusSchema = z.enum(["planned", "building"]);

export const interviewPracticeModuleSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
});

export const interviewPracticeSuggestionSchema = z.object({
  title: z.string(),
  summary: z.string(),
  ctaLabel: z.string(),
});

export const interviewPracticeWorkspaceSchema = z.object({
  status: interviewPracticeStatusSchema,
  title: z.string(),
  summary: z.string(),
  availableModules: z.array(interviewPracticeModuleSchema).min(1),
  suggestion: interviewPracticeSuggestionSchema,
  recommendedActions: z.array(z.string()).min(2).max(4),
});

export type InterviewPracticeStatus = z.infer<typeof interviewPracticeStatusSchema>;
export type InterviewPracticeModule = z.infer<typeof interviewPracticeModuleSchema>;
export type InterviewPracticeSuggestion = z.infer<typeof interviewPracticeSuggestionSchema>;
export type InterviewPracticeWorkspace = z.infer<typeof interviewPracticeWorkspaceSchema>;
