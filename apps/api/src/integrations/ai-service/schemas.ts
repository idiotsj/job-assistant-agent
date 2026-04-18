import { z } from "zod";

import { companySchema } from "@/modules/companies/schema";
import { dailyAdviceSchema } from "@/modules/daily-content/schema";
import { jobResumeAnalysisSchema, jobResumeRewriteSuggestionsSchema, jobSchema } from "@/modules/jobs/schema";
import { parsedResumeSchema, profilePatchSchema, resumeDiagnosisSchema, userProfileSchema } from "@/modules/profile/schema";

export const aiJobScoringRequestSchema = z.object({
  profile: userProfileSchema.nullable(),
  jobs: z.array(jobSchema),
});

export const aiJobScoreSchema = z.object({
  jobId: z.string(),
  score: z.number().int().min(0).max(100),
  reason: z.string(),
  signals: z.array(z.string()).default([]),
});

export const aiPipelineMetaSchema = z.object({
  provider: z.string(),
  model: z.string(),
  promptVersion: z.string(),
  latencyMs: z.number().int().nonnegative(),
  fallbackUsed: z.boolean(),
  tokenUsage: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const aiJobScoringResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    items: z.array(aiJobScoreSchema),
  }),
  meta: aiPipelineMetaSchema,
});

export const aiResumeParseRequestSchema = z.object({
  rawText: z.string().min(1),
  fileName: z.string().nullable().optional(),
});

export const aiResumeParseResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    parsed: parsedResumeSchema,
    patch: profilePatchSchema,
  }),
  meta: aiPipelineMetaSchema,
});

export const aiResumeDiagnosisRequestSchema = z.object({
  rawText: z.string().min(1),
  parsedResume: parsedResumeSchema,
  profile: userProfileSchema.nullable(),
});

export const aiResumeDiagnosisResponseSchema = z.object({
  success: z.literal(true),
  data: resumeDiagnosisSchema,
  meta: aiPipelineMetaSchema,
});

export const aiJobResumeAnalysisRequestSchema = z.object({
  rawText: z.string().min(1),
  parsedResume: parsedResumeSchema,
  profile: userProfileSchema.nullable(),
  job: jobSchema,
});

export const aiJobResumeAnalysisResponseSchema = z.object({
  success: z.literal(true),
  data: jobResumeAnalysisSchema,
  meta: aiPipelineMetaSchema,
});

export const aiJobResumeRewriteSuggestionsRequestSchema = z.object({
  rawText: z.string().min(1),
  parsedResume: parsedResumeSchema,
  profile: userProfileSchema.nullable(),
  job: jobSchema,
});

export const aiJobResumeRewriteSuggestionsResponseSchema = z.object({
  success: z.literal(true),
  data: jobResumeRewriteSuggestionsSchema,
  meta: aiPipelineMetaSchema,
});

export const aiDailyAdviceRequestSchema = z.object({
  profile: userProfileSchema.nullable(),
  curatedAdvice: z
    .object({
      title: z.string(),
      body: z.string(),
    })
    .nullable(),
  featuredCompany: companySchema.nullable(),
  featuredJobs: z.array(jobSchema).default([]),
});

export const aiDailyAdviceResponseSchema = z.object({
  success: z.literal(true),
  data: dailyAdviceSchema,
  meta: aiPipelineMetaSchema,
});

export type AiJobScoringRequest = z.infer<typeof aiJobScoringRequestSchema>;
export type AiJobScore = z.infer<typeof aiJobScoreSchema>;
export type AiPipelineMeta = z.infer<typeof aiPipelineMetaSchema>;
export type AiDailyAdviceRequest = z.infer<typeof aiDailyAdviceRequestSchema>;
export type AiDailyAdviceResponse = z.infer<typeof aiDailyAdviceResponseSchema>;
export type AiResumeParseRequest = z.infer<typeof aiResumeParseRequestSchema>;
export type AiResumeParseData = z.infer<typeof aiResumeParseResponseSchema>["data"];
export type AiResumeParseResponse = z.infer<typeof aiResumeParseResponseSchema>;
export type AiResumeDiagnosisRequest = z.infer<typeof aiResumeDiagnosisRequestSchema>;
export type AiResumeDiagnosisData = z.infer<typeof aiResumeDiagnosisResponseSchema>["data"];
export type AiResumeDiagnosisResponse = z.infer<typeof aiResumeDiagnosisResponseSchema>;
export type AiJobResumeAnalysisRequest = z.infer<typeof aiJobResumeAnalysisRequestSchema>;
export type AiJobResumeAnalysisData = z.infer<typeof aiJobResumeAnalysisResponseSchema>["data"];
export type AiJobResumeAnalysisResponse = z.infer<typeof aiJobResumeAnalysisResponseSchema>;
export type AiJobResumeRewriteSuggestionsRequest = z.infer<typeof aiJobResumeRewriteSuggestionsRequestSchema>;
export type AiJobResumeRewriteSuggestionsData = z.infer<typeof aiJobResumeRewriteSuggestionsResponseSchema>["data"];
export type AiJobResumeRewriteSuggestionsResponse = z.infer<typeof aiJobResumeRewriteSuggestionsResponseSchema>;
