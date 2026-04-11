import { z, type ZodType } from "zod";

import { paginationQuerySchema } from "@job-assistant/contracts/http";

import { ValidationAppError } from "@/core/errors/app-error";

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

function normalizeQueryParams(request: Request) {
  const result: Record<string, string | string[]> = {};
  const url = new URL(request.url);

  url.searchParams.forEach((value, key) => {
    const previous = result[key];
    if (previous === undefined) {
      result[key] = value;
      return;
    }

    result[key] = Array.isArray(previous) ? [...previous, value] : [previous, value];
  });

  return result;
}

export function parseQuery<T>(request: Request, schema: ZodType<T>) {
  const parsed = schema.safeParse(normalizeQueryParams(request));
  if (!parsed.success) {
    throw new ValidationAppError("Invalid query parameters", parsed.error.flatten());
  }
  return parsed.data;
}

export async function parseBody<T>(request: Request, schema: ZodType<T>) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    throw new ValidationAppError("Invalid JSON body");
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new ValidationAppError("Invalid request body", parsed.error.flatten());
  }
  return parsed.data;
}

export function toOffset(pagination: PaginationQuery) {
  return (pagination.page - 1) * pagination.limit;
}
