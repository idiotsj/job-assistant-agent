import { describe, expect, it } from "vitest";

import { ServiceUnavailableError } from "@/core/errors/app-error";
import { createTestAppContext } from "@/testing/create-test-app-context";
import { processSingleAiTask } from "@/modules/ai-tasks/worker";

describe("ai task worker", () => {
  it("processes a queued job resume rewrite task and stores result", async () => {
    const context = createTestAppContext(
      {},
      {
        aiService: {
          enabled: true,
          async generateDailyAdvice() {
            throw new Error("not needed");
          },
          async scoreJobs() {
            return {
              items: [],
              meta: {
                provider: "openai",
                model: "gpt-test",
                promptVersion: "v1",
                latencyMs: 1,
                fallbackUsed: false,
                tokenUsage: null,
              },
            };
          },
          async parseResume() {
            return {
              parsed: {
                summary: "解析完成",
                detectedSkills: ["React"],
                detectedJobTypes: ["前端开发"],
                detectedCities: ["上海"],
                education: {
                  university: "同济大学",
                  major: "计算机科学",
                },
                confidence: 0.9,
              },
              patch: {
                university: "同济大学",
                major: "计算机科学",
                skills: ["React"],
                preferredJobTypes: ["前端开发"],
                targetCities: ["上海"],
              },
              meta: {
                provider: "openai",
                model: "gpt-test",
                promptVersion: "v1",
                latencyMs: 1,
                fallbackUsed: false,
                tokenUsage: null,
              },
            };
          },
          async diagnoseResume() {
            throw new Error("not needed");
          },
          async analyzeResumeForJob() {
            throw new Error("not needed");
          },
          async suggestResumeRewriteForJob() {
            return {
              rewriteSuggestions: {
                version: "v1",
                generatedAt: new Date().toISOString(),
                summary: "先改开头和技能区。",
                headlineSuggestion: "前端开发候选人 | 上海 | React 对齐",
                summarySuggestion: "聚焦前端开发方向。",
                keywordSuggestions: ["前端开发", "React", "项目经历"],
                sectionSuggestions: [
                  {
                    section: "headline",
                    currentIssue: "抬头不聚焦。",
                    rewriteGoal: "先说明投递方向。",
                    suggestedText: "前端开发候选人 | 上海 | React 对齐",
                  },
                  {
                    section: "summary",
                    currentIssue: "摘要太泛。",
                    rewriteGoal: "更贴岗位。",
                    suggestedText: "聚焦前端开发方向。",
                  },
                ],
                actionChecklist: ["前置关键词", "改写项目经历"],
              },
              meta: {
                provider: "openai",
                model: "gpt-test",
                promptVersion: "v1",
                latencyMs: 1,
                fallbackUsed: false,
                tokenUsage: null,
              },
            };
          },
        },
      },
    );

    const created = await context.services.aiTasks.createTask({
      capability: "job_resume_rewrite",
      userId: "user-1",
      payloadJson: {
        jobId: "job-1",
        input: {
          rawText: "同济大学计算机科学专业，熟悉 React。",
          fileName: "resume.txt",
        },
        requestId: "req-worker-1",
      },
      requestId: "req-worker-1",
    });

    const processed = await processSingleAiTask(context, "test-worker");
    expect(processed).toBe(true);

    const task = await context.services.aiTasks.getTask(created.taskId, "user-1");
    expect(task.status).toBe("succeeded");
    expect(task.result).not.toBeNull();
    expect(task.progress?.step).toBe("completed");
  });

  it("preserves stable app error codes on async task failure", async () => {
    const context = createTestAppContext(
      {},
      {
        aiService: {
          enabled: true,
          async generateDailyAdvice() {
            throw new Error("not needed");
          },
          async scoreJobs() {
            return {
              items: [],
              meta: {
                provider: "openai",
                model: "gpt-test",
                promptVersion: "v1",
                latencyMs: 1,
                fallbackUsed: false,
                tokenUsage: null,
              },
            };
          },
          async parseResume() {
            return {
              parsed: {
                summary: "解析完成",
                detectedSkills: ["React"],
                detectedJobTypes: ["前端开发"],
                detectedCities: ["上海"],
                education: {
                  university: "同济大学",
                  major: "计算机科学",
                },
                confidence: 0.9,
              },
              patch: {
                university: "同济大学",
                major: "计算机科学",
                skills: ["React"],
                preferredJobTypes: ["前端开发"],
                targetCities: ["上海"],
              },
              meta: {
                provider: "openai",
                model: "gpt-test",
                promptVersion: "v1",
                latencyMs: 1,
                fallbackUsed: false,
                tokenUsage: null,
              },
            };
          },
          async diagnoseResume() {
            throw new Error("not needed");
          },
          async analyzeResumeForJob() {
            throw new Error("not needed");
          },
          async suggestResumeRewriteForJob() {
            throw new ServiceUnavailableError(
              "Job resume rewrite suggestions are temporarily unavailable",
              undefined,
              "AI_SERVICE_UNAVAILABLE",
            );
          },
        },
      },
    );

    const created = await context.services.aiTasks.createTask({
      capability: "job_resume_rewrite",
      userId: "user-1",
      payloadJson: {
        jobId: "job-1",
        input: {
          rawText: "同济大学计算机科学专业，熟悉 React。",
          fileName: "resume.txt",
        },
        requestId: "req-worker-failure",
      },
      requestId: "req-worker-failure",
    });

    const processed = await processSingleAiTask(context, "test-worker");
    expect(processed).toBe(true);

    const task = await context.services.aiTasks.getTask(created.taskId, "user-1");
    expect(task.status).toBe("failed");
    expect(task.error?.code).toBe("AI_SERVICE_UNAVAILABLE");
  });

  it("treats transient claim failures as non-fatal idle iterations", async () => {
    const context = createTestAppContext();
    let attempts = 0;
    context.repositories.aiTasks.claimNext = async () => {
      attempts += 1;
      throw new Error("temporary db outage");
    };

    const processed = await processSingleAiTask(context, "test-worker");
    expect(processed).toBe(false);
    expect(attempts).toBe(1);
  });
});
