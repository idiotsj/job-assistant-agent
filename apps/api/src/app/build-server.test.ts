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

  it("rejects forged session headers without a valid cookie session", async () => {
    const server = await buildServer();

    try {
      const response = await server.inject({
        method: "GET",
        url: "/api/profile",
        headers: {
          "x-session-user-id": "user-1",
          "x-internal-auth-user-id": "user-1",
          "x-user-id": "user-1",
        },
      });

      expect(response.statusCode).toBe(401);
    } finally {
      await server.close();
    }
  });

  it("allows authenticated users to call resume parse, diagnose, job analysis, and rewrite suggestions through cookie session", async () => {
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
            async analyzeResumeForJob() {
              return {
                analysis: {
                  version: "v1",
                  generatedAt: new Date().toISOString(),
                  overallScore: 73,
                  verdict: "partial_match",
                  summary: "简历和岗位有交集，但仍需补强关键证据。",
                  matchedRequirements: ["岗位强调 Python，你的简历里已经有对应技能信号。"],
                  gaps: ["岗位强调 React，但简历里还缺少直接证据。"],
                  resumeRisks: ["缺少量化结果或明确成果指标，竞争力容易被低估。"],
                  actionPlan: {
                    topPriority: "先补能证明 React 的项目、课程或实习证据。",
                    nextSteps: [
                      "补一段能支撑 React 的经历，并写清任务、动作和结果。",
                      "给最关键的一段项目补 1 到 2 个量化结果。",
                    ],
                  },
                },
                meta: {
                  provider: "openai",
                  model: "gpt-test",
                  promptVersion: "v1",
                  latencyMs: 16,
                  fallbackUsed: false,
                  tokenUsage: null,
                },
              };
            },
            async suggestResumeRewriteForJob() {
              return {
                rewriteSuggestions: {
                  version: "v1",
                  generatedAt: new Date().toISOString(),
                  summary: "建议优先改写简历开头、技能区和最贴近岗位的一段项目经历。",
                  headlineSuggestion: "前端开发候选人 | 上海 | React 项目经验与岗位关键词对齐",
                  summarySuggestion: "聚焦前端开发方向，已具备 Python 等基础能力，希望在上海参与互联网业务场景下的页面与功能建设。",
                  keywordSuggestions: ["前端开发", "Python", "React"],
                  sectionSuggestions: [
                    {
                      section: "headline",
                      currentIssue: "当前简历抬头不够贴近目标岗位。",
                      rewriteGoal: "让招聘方一眼看到投递方向。",
                      suggestedText: "前端开发候选人 | 上海 | React 项目经验与岗位关键词对齐",
                    },
                    {
                      section: "summary",
                      currentIssue: "缺少岗位定向摘要。",
                      rewriteGoal: "在开头快速说明能力与目标岗位的关联。",
                      suggestedText: "聚焦前端开发方向，已具备 Python 等基础能力，希望在上海参与互联网业务场景下的页面与功能建设。",
                    },
                  ],
                  actionChecklist: [
                    "把岗位关键词提前到简历开头和技能区。",
                    "优先改写最贴近目标岗位的一段项目经历。",
                  ],
                },
                meta: {
                  provider: "openai",
                  model: "gpt-test",
                  promptVersion: "v1",
                  latencyMs: 17,
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

      const analyzeResponse = await server.inject({
        method: "POST",
        url: "/api/jobs/job-1/resume/analyze",
        headers: {
          cookie: cookieHeader,
        },
        payload: {
          rawText: "同济大学计算机科学专业，熟悉 Python，目标前端开发。",
          fileName: "resume.txt",
        },
      });

      expect(analyzeResponse.statusCode).toBe(200);
      expect(analyzeResponse.json().data.analysis.verdict).toBe("partial_match");
      expect(analyzeResponse.json().data.profile.resumeData.parsedResume.fileName).toBe("resume.txt");

      const rewriteResponse = await server.inject({
        method: "POST",
        url: "/api/jobs/job-1/resume/rewrite-suggestions",
        headers: {
          cookie: cookieHeader,
        },
        payload: {
          rawText: "同济大学计算机科学专业，熟悉 Python，目标前端开发。",
          fileName: "resume.txt",
        },
      });

      expect(rewriteResponse.statusCode).toBe(200);
      expect(rewriteResponse.json().data.rewriteSuggestions.keywordSuggestions).toContain("React");
      expect(rewriteResponse.json().data.profile.resumeData.parsedResume.fileName).toBe("resume.txt");
    } finally {
      await server.close();
    }
  });
});
