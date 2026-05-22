import { z } from "zod";

import { jobResumeRewriteSuggestionsResultSchema } from "./jobs";

export const aiTaskCapabilitySchema = z.enum(["job_resume_rewrite"]);

export const aiTaskStatusSchema = z.enum(["pending", "running", "succeeded", "failed", "cancelled"]);

export const aiTaskProgressSchema = z.object({
  step: z.string(),
  message: z.string(),
  percent: z.number().int().min(0).max(100),
});

export const aiTaskErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).default({}),
});

export const aiTaskResultSchema = z.union([jobResumeRewriteSuggestionsResultSchema, z.record(z.string(), z.unknown())]);

export const aiTaskSubjectSchema = z.object({
  kind: z.enum(["job"]),
  id: z.string(),
});

export const aiTaskSchema = z.object({
  id: z.string(),
  capability: aiTaskCapabilitySchema,
  status: aiTaskStatusSchema,
  progress: aiTaskProgressSchema.nullable(),
  result: aiTaskResultSchema.nullable(),
  error: aiTaskErrorSchema.nullable(),
  subject: aiTaskSubjectSchema.nullable().default(null),
  createdAt: z.string(),
  startedAt: z.string().nullable(),
  finishedAt: z.string().nullable(),
});

export const aiTaskListQuerySchema = z.object({
  capability: aiTaskCapabilitySchema.optional(),
  status: aiTaskStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const aiTaskCreatedSchema = z.object({
  taskId: z.string(),
  capability: aiTaskCapabilitySchema,
  status: aiTaskStatusSchema,
});

export const aiTaskWsSubscribeMessageSchema = z.object({
  type: z.literal("subscribe"),
  taskIds: z.array(z.string()).min(1).max(50),
});

export const aiTaskWsUpdatedEventSchema = z.object({
  type: z.literal("task.updated"),
  taskId: z.string(),
  status: aiTaskStatusSchema,
  progress: aiTaskProgressSchema.nullable(),
});

export const aiTaskWsErrorEventSchema = z.object({
  type: z.literal("error"),
  code: z.string(),
  message: z.string(),
});

export type AiTaskCapability = z.infer<typeof aiTaskCapabilitySchema>;
export type AiTaskStatus = z.infer<typeof aiTaskStatusSchema>;
export type AiTaskProgress = z.infer<typeof aiTaskProgressSchema>;
export type AiTaskError = z.infer<typeof aiTaskErrorSchema>;
export type AiTaskResult = z.infer<typeof aiTaskResultSchema>;
export type AiTaskSubject = z.infer<typeof aiTaskSubjectSchema>;
export type AiTask = z.infer<typeof aiTaskSchema>;
export type AiTaskListQuery = z.infer<typeof aiTaskListQuerySchema>;
export type AiTaskCreated = z.infer<typeof aiTaskCreatedSchema>;
export type AiTaskWsSubscribeMessage = z.infer<typeof aiTaskWsSubscribeMessageSchema>;
export type AiTaskWsUpdatedEvent = z.infer<typeof aiTaskWsUpdatedEventSchema>;
export type AiTaskWsErrorEvent = z.infer<typeof aiTaskWsErrorEventSchema>;
