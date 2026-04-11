import { companyListQuerySchema, companySchema } from "@job-assistant/contracts/companies";
import { createPaginatedResponseSchema, createSuccessResponseSchema } from "@job-assistant/contracts/http";

import { apiGet } from "./client";

const companiesListResponseSchema = createPaginatedResponseSchema(companySchema);
const companyDetailResponseSchema = createSuccessResponseSchema(companySchema);

export async function listCompanies(query: unknown = {}) {
  const payload = companyListQuerySchema.parse(query);
  return apiGet("/api/companies", companiesListResponseSchema, payload);
}

export async function getCompany(id: string) {
  const response = await apiGet(`/api/companies/${id}`, companyDetailResponseSchema);
  return response.data;
}
