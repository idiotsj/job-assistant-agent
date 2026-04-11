import {
  authUserSchema,
  loginInputSchema,
  logoutResponseSchema,
  registerInputSchema,
} from "@job-assistant/contracts/auth";
import { createSuccessResponseSchema } from "@job-assistant/contracts/http";

import { apiGet, apiPost } from "./client";

const authUserResponseSchema = createSuccessResponseSchema(authUserSchema);
const logoutResponseSchemaWrapped = createSuccessResponseSchema(logoutResponseSchema);

export async function register(input: unknown) {
  const payload = registerInputSchema.parse(input);
  const response = await apiPost("/api/auth/register", payload, authUserResponseSchema);
  return response.data;
}

export async function login(input: unknown) {
  const payload = loginInputSchema.parse(input);
  const response = await apiPost("/api/auth/login", payload, authUserResponseSchema);
  return response.data;
}

export async function logout() {
  const response = await apiPost("/api/auth/logout", undefined, logoutResponseSchemaWrapped);
  return response.data;
}

export async function getCurrentUser() {
  const response = await apiGet("/api/auth/me", authUserResponseSchema);
  return response.data;
}
