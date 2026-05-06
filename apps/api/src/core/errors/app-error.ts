export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(message: string, options?: { code?: string; status?: number; details?: unknown }) {
    super(message);
    this.name = this.constructor.name;
    this.code = options?.code ?? "APP_ERROR";
    this.status = options?.status ?? 500;
    this.details = options?.details;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, { code: "UNAUTHORIZED", status: 401 });
  }
}

export class ValidationAppError extends AppError {
  constructor(message = "Validation failed", details?: unknown) {
    super(message, { code: "VALIDATION_ERROR", status: 400, details });
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", details?: unknown) {
    super(message, { code: "NOT_FOUND", status: 404, details });
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict", details?: unknown, code = "CONFLICT") {
    super(message, { code, status: 409, details });
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = "Service unavailable", details?: unknown, code = "SERVICE_UNAVAILABLE") {
    super(message, { code, status: 503, details });
  }
}

export class ConfigurationError extends AppError {
  constructor(message = "Configuration error", details?: unknown) {
    super(message, { code: "CONFIGURATION_ERROR", status: 500, details });
  }
}

export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message, { details: { name: error.name } });
  }

  return new AppError("Unknown error", { details: { error } });
}
