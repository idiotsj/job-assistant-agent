import {
  jobListQuerySchema,
  jobResumeAnalyzeInputSchema,
  jobResumeAnalyzeResultSchema,
  jobResumeRewriteSuggestionsInputSchema,
  jobResumeRewriteSuggestionsResultSchema,
  jobSchema,
} from "@job-assistant/contracts/jobs";
import { createPaginatedResponseSchema, createSuccessResponseSchema } from "@job-assistant/contracts/http";

import { apiGet, apiPost } from "./client";

const jobsListResponseSchema = createPaginatedResponseSchema(jobSchema);
const jobDetailResponseSchema = createSuccessResponseSchema(jobSchema);
const jobResumeAnalyzeResponseSchema = createSuccessResponseSchema(jobResumeAnalyzeResultSchema);
const jobResumeRewriteSuggestionsResponseSchema = createSuccessResponseSchema(jobResumeRewriteSuggestionsResultSchema);

export async function listJobs(query: unknown = {}) {
  const payload = jobListQuerySchema.parse(query);
  return apiGet("/api/jobs", jobsListResponseSchema, payload);
}

export async function getJob(id: string) {
  const response = await apiGet(`/api/jobs/${id}`, jobDetailResponseSchema);
  return response.data;
}

export async function analyzeJobResume(id: string, input: unknown) {
  const payload = jobResumeAnalyzeInputSchema.parse(input);
  const response = await apiPost(`/api/jobs/${id}/resume/analyze`, payload, jobResumeAnalyzeResponseSchema);
  return response.data;
}

export async function getJobResumeRewriteSuggestions(id: string, input: unknown) {
  const payload = jobResumeRewriteSuggestionsInputSchema.parse(input);
  const response = await apiPost(
    `/api/jobs/${id}/resume/rewrite-suggestions`,
    payload,
    jobResumeRewriteSuggestionsResponseSchema,
  );
  return response.data;
}
