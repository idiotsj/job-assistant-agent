import { normalizeError } from "@/core/errors/app-error";
import { logger } from "@/core/logger";
import { attachRequestId, injectRequestId, resolveRequestId } from "@/core/http/request-id";
import { failure } from "@/core/response/json";

export type RouteHandler = (request: Request) => Promise<Response>;

const slowRequestThresholdMs = 800;

export function withErrorHandling(handler: RouteHandler): RouteHandler {
  return async (request) => {
    const requestId = resolveRequestId(request);
    const requestWithId = injectRequestId(request, requestId);
    const startedAt = Date.now();

    try {
      const response = await handler(requestWithId);
      const durationMs = Date.now() - startedAt;

      if (durationMs >= slowRequestThresholdMs) {
        logger.warn("Slow route request", {
          requestId,
          method: requestWithId.method,
          path: new URL(requestWithId.url).pathname,
          durationMs,
          status: response.status,
        });
      }

      return attachRequestId(response, requestId);
    } catch (error) {
      const normalized = normalizeError(error);
      logger.error("Route handler failed", {
        requestId,
        method: requestWithId.method,
        path: new URL(requestWithId.url).pathname,
        code: normalized.code,
        message: normalized.message,
        durationMs: Date.now() - startedAt,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return attachRequestId(failure(normalized), requestId);
    }
  };
}
