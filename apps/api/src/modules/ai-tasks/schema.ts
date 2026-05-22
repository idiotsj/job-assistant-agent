export {
  aiTaskCapabilitySchema,
  aiTaskCreatedSchema,
  aiTaskErrorSchema,
  aiTaskListQuerySchema,
  aiTaskProgressSchema,
  aiTaskSchema,
  aiTaskStatusSchema,
  aiTaskWsErrorEventSchema,
  aiTaskWsSubscribeMessageSchema,
  aiTaskWsUpdatedEventSchema,
} from "@job-assistant/contracts/ai-tasks";
export type {
  AiTask,
  AiTaskCapability,
  AiTaskCreated,
  AiTaskError,
  AiTaskListQuery,
  AiTaskProgress,
  AiTaskResult,
  AiTaskStatus,
  AiTaskSubject,
  AiTaskWsErrorEvent,
  AiTaskWsSubscribeMessage,
  AiTaskWsUpdatedEvent,
} from "@job-assistant/contracts/ai-tasks";

import { z } from "zod";

import { aiTaskCapabilitySchema, aiTaskErrorSchema, aiTaskProgressSchema, aiTaskStatusSchema } from "@job-assistant/contracts/ai-tasks";
import { jobResumeRewriteSuggestionsInputSchema, jobResumeRewriteSuggestionsResultSchema } from "@/modules/jobs/schema";

export const jobResumeRewriteTaskPayloadSchema = z.object({
  jobId: z.string(),
  input: jobResumeRewriteSuggestionsInputSchema,
  requestId: z.string().nullable().optional(),
});

export const aiTaskRecordSchema = z.object({
  id: z.string(),
  capability: aiTaskCapabilitySchema,
  status: aiTaskStatusSchema,
  payloadJson: z.record(z.string(), z.unknown()),
  resultJson: z.record(z.string(), z.unknown()).nullable(),
  errorJson: aiTaskErrorSchema.nullable(),
  progressJson: aiTaskProgressSchema.nullable(),
  requestId: z.string().nullable(),
  userId: z.string(),
  retryCount: z.number().int().nonnegative(),
  scheduledAt: z.string().nullable(),
  startedAt: z.string().nullable(),
  finishedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const aiTaskResultByCapabilitySchema = z.object({
  job_resume_rewrite: jobResumeRewriteSuggestionsResultSchema,
});

export type JobResumeRewriteTaskPayload = z.infer<typeof jobResumeRewriteTaskPayloadSchema>;
export type AiTaskRecord = z.infer<typeof aiTaskRecordSchema>;
