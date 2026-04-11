import { todayContentSchema } from "@job-assistant/contracts/daily-content";
import { createSuccessResponseSchema } from "@job-assistant/contracts/http";

import { apiGet } from "./client";

const todayContentResponseSchema = createSuccessResponseSchema(todayContentSchema);

export async function getTodayContent() {
  const response = await apiGet("/api/daily-content/today", todayContentResponseSchema);
  return response.data;
}
