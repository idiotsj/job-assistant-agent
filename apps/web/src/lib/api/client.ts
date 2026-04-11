import { apiFailureSchema, type ApiError as ApiErrorPayload } from "@job-assistant/contracts/http";

interface Schema<T> {
  parse(input: unknown): T;
}

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: ApiErrorPayload["details"];
  readonly requestId?: string;

  constructor(params: {
    code: string;
    message: string;
    status: number;
    details?: ApiErrorPayload["details"];
    requestId?: string;
  }) {
    super(params.message);
    this.name = "ApiError";
    this.code = params.code;
    this.status = params.status;
    this.details = params.details ?? {};
    this.requestId = params.requestId;
  }
}

function buildUrl(path: string, query?: Record<string, unknown>) {
  if (!query) {
    return path;
  }

  const url = new URL(path, "http://local.test");

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined && item !== null && item !== "") {
          url.searchParams.append(key, String(item));
        }
      }
      continue;
    }

    url.searchParams.set(key, String(value));
  }

  return `${url.pathname}${url.search}`;
}

async function parseError(response: Response, payload: unknown): Promise<never> {
  const parsed = apiFailureSchema.safeParse(payload);
  const requestId = response.headers.get("x-request-id") ?? undefined;

  if (parsed.success) {
    throw new ApiError({
      code: parsed.data.error.code,
      message: parsed.data.error.message,
      status: response.status,
      details: parsed.data.error.details,
      requestId,
    });
  }

  throw new ApiError({
    code: "REQUEST_FAILED",
    message: response.statusText || "Request failed",
    status: response.status,
    details: {},
    requestId,
  });
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit,
  responseSchema: Schema<T>,
  query?: Record<string, unknown>,
) {
  const response = await fetch(buildUrl(path, query), {
    ...options,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers ?? {}),
    },
    cache: "no-store",
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    return parseError(response, payload);
  }

  return responseSchema.parse(payload);
}

export function apiGet<T>(path: string, responseSchema: Schema<T>, query?: Record<string, unknown>) {
  return apiRequest(path, { method: "GET" }, responseSchema, query);
}

export function apiPost<TInput, TOutput>(
  path: string,
  input: TInput,
  responseSchema: Schema<TOutput>,
) {
  return apiRequest(
    path,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    responseSchema,
  );
}

export function apiPut<TInput, TOutput>(
  path: string,
  input: TInput,
  responseSchema: Schema<TOutput>,
) {
  return apiRequest(
    path,
    {
      method: "PUT",
      body: JSON.stringify(input),
    },
    responseSchema,
  );
}

export function apiDelete<T>(path: string, responseSchema: Schema<T>) {
  return apiRequest(
    path,
    {
      method: "DELETE",
    },
    responseSchema,
  );
}
