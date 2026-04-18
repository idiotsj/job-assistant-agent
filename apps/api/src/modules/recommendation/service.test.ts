import { afterEach, describe, expect, it, vi } from "vitest";

import { logger } from "@/core/logger";
import type { AiServiceClient } from "@/integrations/ai-service/client";
import { createTestAppContext } from "@/testing/create-test-app-context";

describe("recommendation service", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("ranks matching jobs and keeps sectioned output", async () => {
    const context = createTestAppContext();

    const result = await context.services.recommendation.getHomeRecommendations("user-1");

    expect(result.jobs[0]?.workLocation).toBe("上海");
    expect(result.jobs[0]?.source).toBe("jobs");
    expect(result.cases[0]?.careerPath).toBe("前端开发");
    expect(result.events[0]?.city).toBe("上海");
    expect(result.dailyAdvice.source).toBe("curated");
  });

  it("falls back to generic daily advice when curated content is unavailable", async () => {
    const context = createTestAppContext({ dailyContent: [] });

    const result = await context.services.recommendation.getHomeRecommendations("user-1");

    expect(result.dailyAdvice.source).toBe("fallback");
    expect(result.dailyAdvice.title).toContain("完善画像");
  });

  it("falls back to broader content when strict profile filters return no candidates", async () => {
    const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});
    const context = createTestAppContext({
      profiles: [
        {
          userId: "user-1",
          university: "同济大学",
          major: "计算机科学",
          grade: "大四",
          targetIndustries: ["制造业"],
          targetCities: ["深圳"],
          skills: ["TypeScript"],
          preferredJobTypes: ["前端开发"],
          considersPostgraduate: false,
          considersCivilService: false,
          resumeData: null,
        },
      ],
    });

    const result = await context.services.recommendation.getHomeRecommendations("user-1");

    expect(result.jobs.length).toBeGreaterThan(0);
    expect(result.cases.length).toBeGreaterThan(0);
    expect(result.events.length).toBeGreaterThan(0);
    expect(warnSpy).toHaveBeenCalledWith(
      "Recommendation recall fell back to broader candidates",
      expect.objectContaining({
        userId: "user-1",
        sections: expect.arrayContaining(["jobs", "events"]),
      }),
    );
  });

  it("prefers Python job scoring when AI service is available", async () => {
    const aiService: AiServiceClient = {
      enabled: true,
      async generateDailyAdvice() {
        return {
          advice: {
            title: "今天先整理高匹配岗位",
            body: "你已经有比较明确的目标，可以先处理高匹配岗位投递。",
            source: "ai",
          },
          meta: {
            provider: "openai",
            model: "gpt-test",
            promptVersion: "v1",
            latencyMs: 14,
            fallbackUsed: false,
            tokenUsage: null,
          },
        };
      },
      async scoreJobs() {
        return {
          items: [
            {
              jobId: "job-2",
              score: 99,
              reason: "Python 模型判断更贴近你的近期投递方向",
              signals: ["preferred_job_type"],
            },
            {
              jobId: "job-1",
              score: 60,
              reason: "仍然匹配，但优先级略低",
              signals: ["industry_match"],
            },
            {
              jobId: "job-4",
              score: 45,
              reason: "曝光质量高，但与你当前近期方向不完全一致",
              signals: ["featured"],
            },
          ],
          meta: {
            provider: "openai",
            model: "gpt-test",
            promptVersion: "v1",
            latencyMs: 15,
            fallbackUsed: false,
            tokenUsage: null,
          },
        };
      },
      async parseResume() {
        throw new Error("not implemented in test");
      },
      async diagnoseResume() {
        throw new Error("not implemented in test");
      },
      async analyzeResumeForJob() {
        throw new Error("not implemented in test");
      },
      async suggestResumeRewriteForJob() {
        throw new Error("not implemented in test");
      },
    };

    const context = createTestAppContext({}, { aiService });

    const result = await context.services.recommendation.getHomeRecommendations("user-1");

    expect(result.jobs[0]?.id).toBe("job-2");
    expect(result.jobs[0]?.reason).toContain("Python 模型");
  });

  it("falls back to TypeScript job scoring when AI service fails", async () => {
    const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});
    const aiService: AiServiceClient = {
      enabled: true,
      async generateDailyAdvice() {
        throw new Error("daily advice unavailable");
      },
      async scoreJobs() {
        throw new Error("ai unavailable");
      },
      async parseResume() {
        throw new Error("not implemented in test");
      },
      async diagnoseResume() {
        throw new Error("not implemented in test");
      },
      async analyzeResumeForJob() {
        throw new Error("not implemented in test");
      },
      async suggestResumeRewriteForJob() {
        throw new Error("not implemented in test");
      },
    };

    const context = createTestAppContext({}, { aiService });
    const result = await context.services.recommendation.getHomeRecommendations("user-1");

    expect(result.jobs[0]?.id).toBe("job-1");
    expect(warnSpy).toHaveBeenCalledWith(
      "AI job scoring failed; using TypeScript ranking",
      expect.objectContaining({
        userId: "user-1",
        error: "ai unavailable",
      }),
    );
  });
});
