import { z } from "zod";

import { paginationQuerySchema } from "./http";
import { parsedResumeSchema, profilePatchSchema, profileResumeParseInputSchema, userProfileSchema } from "./profile";

export const jobSchema = z.object({
  id: z.string(),
  title: z.string(),
  companyId: z.string(),
  companyName: z.string(),
  companyIndustry: z.string(),
  workLocation: z.string(),
  tags: z.array(z.string()).default([]),
  requiredSkills: z.array(z.string()).default([]),
  description: z.string().default(""),
  isFeatured: z.boolean().default(false),
  deadline: z.string().nullable().default(null),
  publishedAt: z.string(),
  popularity: z.number().int().default(0),
});

export const jobListQuerySchema = paginationQuerySchema.extend({
  city: z.union([z.string(), z.array(z.string())]).optional(),
  industry: z.union([z.string(), z.array(z.string())]).optional(),
  keyword: z.string().optional(),
  featuredOnly: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .transform((value) => value === true || value === "true")
    .optional(),
});

export const jobResumeAnalysisVerdictSchema = z.enum(["strong_match", "partial_match", "weak_match"]);

export const jobResumeAnalysisActionPlanSchema = z.object({
  topPriority: z.string(),
  nextSteps: z.array(z.string()).min(2).max(4),
});

export const jobResumeAnalysisSchema = z.object({
  version: z.string(),
  generatedAt: z.string(),
  overallScore: z.number().int().min(0).max(100),
  verdict: jobResumeAnalysisVerdictSchema,
  summary: z.string(),
  matchedRequirements: z.array(z.string()).default([]),
  gaps: z.array(z.string()).default([]),
  resumeRisks: z.array(z.string()).default([]),
  actionPlan: jobResumeAnalysisActionPlanSchema,
});

export const jobResumeAnalyzeInputSchema = profileResumeParseInputSchema;

export const jobResumeAnalyzeResultSchema = z.object({
  analysis: jobResumeAnalysisSchema,
  parsed: parsedResumeSchema,
  appliedPatch: profilePatchSchema,
  profile: userProfileSchema,
});

export const jobResumeRewriteSectionSchema = z.object({
  section: z.enum(["headline", "summary", "skills", "project", "experience"]),
  currentIssue: z.string(),
  rewriteGoal: z.string(),
  suggestedText: z.string(),
});

export const jobResumeRewriteSuggestionsSchema = z.object({
  version: z.string(),
  generatedAt: z.string(),
  summary: z.string(),
  headlineSuggestion: z.string(),
  summarySuggestion: z.string(),
  keywordSuggestions: z.array(z.string()).min(3).max(8),
  sectionSuggestions: z.array(jobResumeRewriteSectionSchema).min(2).max(5),
  actionChecklist: z.array(z.string()).min(2).max(4),
});

export const jobResumeRewriteSuggestionsInputSchema = profileResumeParseInputSchema;

export const jobResumeRewriteSuggestionsResultSchema = z.object({
  rewriteSuggestions: jobResumeRewriteSuggestionsSchema,
  parsed: parsedResumeSchema,
  appliedPatch: profilePatchSchema,
  profile: userProfileSchema,
});

export type Job = z.infer<typeof jobSchema>;
export type JobListQuery = z.infer<typeof jobListQuerySchema>;
export type JobResumeAnalysisVerdict = z.infer<typeof jobResumeAnalysisVerdictSchema>;
export type JobResumeAnalysisActionPlan = z.infer<typeof jobResumeAnalysisActionPlanSchema>;
export type JobResumeAnalysis = z.infer<typeof jobResumeAnalysisSchema>;
export type JobResumeAnalyzeInput = z.infer<typeof jobResumeAnalyzeInputSchema>;
export type JobResumeAnalyzeResult = z.infer<typeof jobResumeAnalyzeResultSchema>;
export type JobResumeRewriteSection = z.infer<typeof jobResumeRewriteSectionSchema>;
export type JobResumeRewriteSuggestions = z.infer<typeof jobResumeRewriteSuggestionsSchema>;
export type JobResumeRewriteSuggestionsInput = z.infer<typeof jobResumeRewriteSuggestionsInputSchema>;
export type JobResumeRewriteSuggestionsResult = z.infer<typeof jobResumeRewriteSuggestionsResultSchema>;
