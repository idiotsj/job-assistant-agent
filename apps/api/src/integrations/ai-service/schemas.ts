import { z } from "zod";

import { jobSchema } from "@/modules/jobs/schema";
import { userProfileSchema } from "@/modules/profile/schema";

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

export const aiJobScoringResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    items: z.array(aiJobScoreSchema),
  }),
});

export const aiResumeParseRequestSchema = z.object({
  rawText: z.string().min(1),
  fileName: z.string().nullable().optional(),
});

export const aiResumeParseResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    summary: z.string(),
    detectedSkills: z.array(z.string()).default([]),
    detectedJobTypes: z.array(z.string()).default([]),
    detectedCities: z.array(z.string()).default([]),
    education: z.object({
      university: z.string().nullable(),
      major: z.string().nullable(),
    }),
    confidence: z.number(),
  }),
});

export type AiJobScoringRequest = z.infer<typeof aiJobScoringRequestSchema>;
export type AiJobScore = z.infer<typeof aiJobScoreSchema>;
export type AiResumeParseRequest = z.infer<typeof aiResumeParseRequestSchema>;
export type AiResumeParseResponse = z.infer<typeof aiResumeParseResponseSchema>;
