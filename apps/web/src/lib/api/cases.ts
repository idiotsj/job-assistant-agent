import { caseListQuerySchema, studentCaseSchema } from "@job-assistant/contracts/cases";
import { createPaginatedResponseSchema } from "@job-assistant/contracts/http";

import { apiGet } from "./client";

const casesListResponseSchema = createPaginatedResponseSchema(studentCaseSchema);

export async function listCases(query: unknown = {}) {
  const payload = caseListQuerySchema.parse(query);
  return apiGet("/api/cases", casesListResponseSchema, payload);
}
