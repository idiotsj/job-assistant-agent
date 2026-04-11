import {
  profileResumeParseInputSchema,
  profileResumeParseResultSchema,
  profileUpdateSchema,
  userProfileSchema,
} from "@job-assistant/contracts/profile";
import { createSuccessResponseSchema } from "@job-assistant/contracts/http";

import { apiGet, apiPost, apiPut } from "./client";

const profileResponseSchema = createSuccessResponseSchema(userProfileSchema);
const profileResumeParseResponseSchema = createSuccessResponseSchema(profileResumeParseResultSchema);

export async function getProfile() {
  const response = await apiGet("/api/profile", profileResponseSchema);
  return response.data;
}

export async function updateProfile(input: unknown) {
  const payload = profileUpdateSchema.parse(input);
  const response = await apiPut("/api/profile", payload, profileResponseSchema);
  return response.data;
}

export async function parseProfileResume(input: unknown) {
  const payload = profileResumeParseInputSchema.parse(input);
  const response = await apiPost("/api/profile/resume/parse", payload, profileResumeParseResponseSchema);
  return response.data;
}
