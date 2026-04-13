import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { setServerAppContextForTesting } from "@/app/context";
import { buildServer } from "@/app/build-server";
import { createTestAppContext } from "@/testing/create-test-app-context";

describe("api server integration", () => {
  beforeEach(() => {
    process.env = {
      ...process.env,
      NODE_ENV: "test",
    };
    setServerAppContextForTesting(createTestAppContext());
  });

  afterEach(async () => {
    setServerAppContextForTesting(undefined);
  });

  it("supports cookie session login, me, and logout", async () => {
    const server = await buildServer();

    try {
      const loginResponse = await server.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: {
          email: "demo@example.com",
          password: "Password123!",
        },
      });

      expect(loginResponse.statusCode).toBe(200);
      const cookieHeader = String(loginResponse.headers["set-cookie"]).split(";")[0];
      expect(cookieHeader).toContain("job_assistant_session=");

      const meResponse = await server.inject({
        method: "GET",
        url: "/api/auth/me",
        headers: {
          cookie: cookieHeader,
        },
      });

      expect(meResponse.statusCode).toBe(200);
      expect(meResponse.json().data.email).toBe("demo@example.com");

      const logoutResponse = await server.inject({
        method: "POST",
        url: "/api/auth/logout",
        headers: {
          cookie: cookieHeader,
        },
      });

      expect(logoutResponse.statusCode).toBe(200);
      expect(logoutResponse.json().data.loggedOut).toBe(true);

      const meAfterLogoutResponse = await server.inject({
        method: "GET",
        url: "/api/auth/me",
      });

      expect(meAfterLogoutResponse.statusCode).toBe(401);
    } finally {
      await server.close();
    }
  });

  it("allows authenticated users to call resume parse and diagnose endpoints through cookie session", async () => {
    setServerAppContextForTesting(
      createTestAppContext(
        {},
        {
          aiService: {
            enabled: true,
            async generateDailyAdvice() {
              return {
                advice: {
                  title: "今天先投递一轮高匹配岗位",
                  body: "保持投递节奏，同时准备项目亮点说明。",
                  source: "ai",
                },
                meta: {
                  provider: "openai",
                  model: "gpt-test",
                  promptVersion: "v1",
                  latencyMs: 11,
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
              return {
                parsed: {
                  summary: "完成简历解析",
                  detectedSkills: ["Python"],
                  detectedJobTypes: ["前端开发"],
                  detectedCities: ["上海"],
                  education: {
                    university: "同济大学",
                    major: "计算机科学",
                  },
                  confidence: 0.88,
                },
                patch: {
                  university: "同济大学",
                  major: "计算机科学",
                  skills: ["Python"],
                  preferredJobTypes: ["前端开发"],
                  targetCities: ["上海"],
                },
                meta: {
                  provider: "openai",
                  model: "gpt-test",
                  promptVersion: "v1",
                  latencyMs: 18,
                  fallbackUsed: false,
                  tokenUsage: null,
                },
              };
            },
            async diagnoseResume() {
              return {
                diagnosis: {
                  version: "v1",
                  generatedAt: new Date().toISOString(),
                  overallScore: 81,
                  summary: "简历基础可用，下一步重点是补强结果证据。",
                  quality: {
                    strengths: ["技能关键词较明确。"],
                    risks: ["缺少量化成果。"],
                    missingInfo: ["项目经历"],
                  },
                  alignment: {
                    targetSummary: "目标岗位偏向 前端开发；优先城市是 上海",
                    matchedSignals: ["简历表达出的岗位方向与画像目标有交集：前端开发。"],
                    gapSignals: [],
                  },
                  actionPlan: {
                    topPriority: "先补一段能支撑前端方向的项目成果。",
                    nextSteps: ["给项目补上可量化结果。"],
                  },
                },
                meta: {
                  provider: "openai",
                  model: "gpt-test",
                  promptVersion: "v1",
                  latencyMs: 19,
                  fallbackUsed: false,
                  tokenUsage: null,
                },
              };
            },
          },
        },
      ),
    );

    const server = await buildServer();

    try {
      const loginResponse = await server.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: {
          email: "demo@example.com",
          password: "Password123!",
        },
      });

      const cookieHeader = String(loginResponse.headers["set-cookie"]).split(";")[0];

      const parseResponse = await server.inject({
        method: "POST",
        url: "/api/profile/resume/parse",
        headers: {
          cookie: cookieHeader,
        },
        payload: {
          rawText: "同济大学计算机科学专业，熟悉 Python，目标前端开发。",
          fileName: "resume.txt",
        },
      });

      expect(parseResponse.statusCode).toBe(200);
      expect(parseResponse.json().data.profile.resumeData.parsedResume.fileName).toBe("resume.txt");

      const diagnoseResponse = await server.inject({
        method: "POST",
        url: "/api/profile/resume/diagnose",
        headers: {
          cookie: cookieHeader,
        },
        payload: {
          rawText: "同济大学计算机科学专业，熟悉 Python，目标前端开发。",
          fileName: "resume.txt",
        },
      });

      expect(diagnoseResponse.statusCode).toBe(200);
      expect(diagnoseResponse.json().data.profile.resumeData.resumeDiagnosis.latest.overallScore).toBe(81);
    } finally {
      await server.close();
    }
  });
});
