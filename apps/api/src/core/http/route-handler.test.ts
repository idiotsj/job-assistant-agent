import { afterEach, describe, expect, it, vi } from "vitest";

import { NotFoundError } from "@/core/errors/app-error";
import { logger } from "@/core/logger";

import { withErrorHandling } from "./route-handler";

describe("route handler instrumentation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("adds a generated request id to successful responses", async () => {
    const handler = withErrorHandling(async () => Response.json({ success: true }));

    const response = await handler(new Request("http://localhost/api/example"));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toBeTruthy();
  });

  it("reuses the incoming request id on failures and logs it", async () => {
    const errorSpy = vi.spyOn(logger, "error").mockImplementation(() => {});
    const handler = withErrorHandling(async () => {
      throw new NotFoundError("Missing resource");
    });

    const response = await handler(
      new Request("http://localhost/api/example", {
        headers: {
          "x-request-id": "req-123",
        },
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(response.headers.get("x-request-id")).toBe("req-123");
    expect(payload.error.code).toBe("NOT_FOUND");
    expect(errorSpy).toHaveBeenCalledWith(
      "Route handler failed",
      expect.objectContaining({
        requestId: "req-123",
        path: "/api/example",
      }),
    );
  });
});
