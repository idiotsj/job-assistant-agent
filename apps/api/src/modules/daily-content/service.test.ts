import { describe, expect, it, vi, afterEach } from "vitest";

import { logger } from "@/core/logger";
import { createTestAppContext } from "@/testing/create-test-app-context";

describe("daily content service", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses AI-generated daily advice when AI service is available", async () => {
    const context = createTestAppContext(
      {},
      {
        aiService: {
          enabled: true,
          async generateDailyAdvice() {
            return {
              advice: {
                title: "今天先投递一轮高匹配岗位",
                body: "围绕上海互联网方向先完成一轮定向投递，再补项目亮点。",
                source: "ai",
              },
              meta: {
                provider: "openai",
                model: "gpt-test",
                promptVersion: "v1",
                latencyMs: 10,
                fallbackUsed: false,
                tokenUsage: null,
              },
            };
          },
          async scoreJobs() {
            return {
              items: [],
              meta: {
                provider: "openai",
                model: "gpt-test",
                promptVersion: "v1",
                latencyMs: 10,
                fallbackUsed: false,
                tokenUsage: null,
              },
            };
          },
          async parseResume() {
            throw new Error("not needed");
          },
          async diagnoseResume() {
            throw new Error("not needed");
          },
          async analyzeResumeForJob() {
            throw new Error("not needed");
          },
        },
      },
    );

    const profile = await context.services.profile.getProfile("user-1");
    const result = await context.services.dailyContent.getTodayContent(profile, {
      requestId: "req-daily-1",
      userId: "user-1",
    });

    expect(result.dailyAdvice.source).toBe("ai");
    expect(result.dailyAdvice.title).toContain("岗位");
  });

  it("falls back to curated or generic advice when AI generation fails", async () => {
    const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});
    const context = createTestAppContext(
      {},
      {
        aiService: {
          enabled: true,
          async generateDailyAdvice() {
            throw new Error("ai daily advice unavailable");
          },
          async scoreJobs() {
            return {
              items: [],
              meta: {
                provider: "openai",
                model: "gpt-test",
                promptVersion: "v1",
                latencyMs: 10,
                fallbackUsed: false,
                tokenUsage: null,
              },
            };
          },
          async parseResume() {
            throw new Error("not needed");
          },
          async diagnoseResume() {
            throw new Error("not needed");
          },
          async analyzeResumeForJob() {
            throw new Error("not needed");
          },
        },
      },
    );

    const profile = await context.services.profile.getProfile("user-1");
    const result = await context.services.dailyContent.getTodayContent(profile, {
      requestId: "req-daily-2",
      userId: "user-1",
    });

    expect(result.dailyAdvice.source).toBe("curated");
    expect(warnSpy).toHaveBeenCalledWith(
      "AI daily advice generation failed; using fallback advice",
      expect.objectContaining({
        userId: "user-1",
        error: "ai daily advice unavailable",
      }),
    );
  });
});
