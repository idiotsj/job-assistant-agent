import { jobListQuerySchema, jobSchema } from "@job-assistant/contracts/jobs";
import { createPaginatedResponseSchema, createSuccessResponseSchema } from "@job-assistant/contracts/http";

import { apiGet } from "./client";

const jobsListResponseSchema = createPaginatedResponseSchema(jobSchema);
const jobDetailResponseSchema = createSuccessResponseSchema(jobSchema);

export async function listJobs(query: unknown = {}) {
  const payload = jobListQuerySchema.parse(query);
  return apiGet("/api/jobs", jobsListResponseSchema, payload);
}

export async function getJob(id: string) {
  const response = await apiGet(`/api/jobs/${id}`, jobDetailResponseSchema);
  return response.data;
}
