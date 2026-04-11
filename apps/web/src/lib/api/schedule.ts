import {
  scheduleCreateInputSchema,
  scheduleDeleteResultSchema,
  scheduleItemSchema,
  scheduleUpdateInputSchema,
} from "@job-assistant/contracts/schedule";
import { createSuccessResponseSchema } from "@job-assistant/contracts/http";

import { apiDelete, apiGet, apiPost, apiPut } from "./client";

const scheduleListResponseSchema = createSuccessResponseSchema(scheduleItemSchema.array());
const scheduleItemResponseSchema = createSuccessResponseSchema(scheduleItemSchema);
const scheduleDeleteResponseSchema = createSuccessResponseSchema(scheduleDeleteResultSchema);

export async function getScheduleTimeline() {
  const response = await apiGet("/api/schedule", scheduleListResponseSchema);
  return response.data;
}

export async function createScheduleItem(input: unknown) {
  const payload = scheduleCreateInputSchema.parse(input);
  const response = await apiPost("/api/schedule", payload, scheduleItemResponseSchema);
  return response.data;
}

export async function updateScheduleItem(id: string, input: unknown) {
  const payload = scheduleUpdateInputSchema.parse(input);
  const response = await apiPut(`/api/schedule/${id}`, payload, scheduleItemResponseSchema);
  return response.data;
}

export async function deleteScheduleItem(id: string) {
  const response = await apiDelete(`/api/schedule/${id}`, scheduleDeleteResponseSchema);
  return response.data;
}
