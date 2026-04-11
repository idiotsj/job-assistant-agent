import { describe, expect, it, vi } from "vitest";

import { createSuccessResponseSchema } from "@job-assistant/contracts/http";
import { z } from "zod";

import { ApiError, apiGet } from "./client";

describe("api client", () => {
  it("parses successful responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { ok: true } }), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    const schema = createSuccessResponseSchema(
      z.object({
        ok: z.boolean(),
      }),
    );

    const response = await apiGet("/api/example", schema);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/example",
      expect.objectContaining({
        credentials: "include",
        method: "GET",
      }),
    );
    expect(response.data.ok).toBe(true);
  });

  it("throws ApiError for failed responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: false,
            error: {
              code: "UNAUTHORIZED",
              message: "Unauthorized",
              details: {},
            },
          }),
          {
            status: 401,
            headers: {
              "content-type": "application/json",
              "x-request-id": "req-401",
            },
          },
        ),
      ),
    );

    await expect(
      apiGet(
        "/api/protected",
        createSuccessResponseSchema(
          z.object({
            ok: z.boolean(),
          }),
        ),
      ),
    ).rejects.toMatchObject(
      expect.objectContaining({
        code: "UNAUTHORIZED",
        status: 401,
        requestId: "req-401",
      }),
    );
  });
});
