import { eventListQuerySchema, eventSchema } from "@job-assistant/contracts/events";
import { createPaginatedResponseSchema } from "@job-assistant/contracts/http";

import { apiGet } from "./client";

const eventsListResponseSchema = createPaginatedResponseSchema(eventSchema);

export async function listEvents(query: unknown = {}) {
  const payload = eventListQuerySchema.parse(query);
  return apiGet("/api/events", eventsListResponseSchema, payload);
}
