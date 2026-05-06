import { afterEach, describe, expect, it } from "vitest";

import { setServerAppContextForTesting } from "@/app/context";
import { GET as getMe } from "@/routes/auth/me/route";
import { POST as postRegister } from "@/routes/auth/register/route";
import { createTestAppContext } from "@/testing/create-test-app-context";
import { GET as getCases } from "@/routes/cases/route";
import { GET as getCompanies } from "@/routes/companies/route";
import { GET as getCompany } from "@/routes/companies/[id]/route";
import { GET as getCivilServiceAdvice } from "@/routes/civil-service/advice/route";
import { GET as getTodayContent } from "@/routes/daily-content/today/route";
import { GET as getEvents } from "@/routes/events/route";
import { GET as getJobs } from "@/routes/jobs/route";
import { POST as postJobResumeAnalyze } from "@/routes/jobs/[id]/resume/analyze/route";
import { POST as postJobResumeRewriteSuggestions } from "@/routes/jobs/[id]/resume/rewrite-suggestions/route";
import { POST as postJobResumeRewriteTask } from "@/routes/jobs/[id]/resume/rewrite-suggestions/tasks/route";
import { GET as getPostgraduateAdvice } from "@/routes/postgraduate/advice/route";
import { GET as getProfile, PUT as putProfile } from "@/routes/profile/route";
import { POST as postProfileResumeDiagnose } from "@/routes/profile/resume/diagnose/route";
import { POST as postProfileResumeParse } from "@/routes/profile/resume/parse/route";
import { GET as getRecommendHome } from "@/routes/recommend/home/route";
import { DELETE as deleteScheduleItem, PUT as putScheduleItem } from "@/routes/schedule/[id]/route";
import { GET as getSchedule, POST as postSchedule } from "@/routes/schedule/route";
import { GET as getAiTask, GET_LIST as getAiTasks } from "@/routes/ai/tasks/route";
import {
  jobResumeAnalyzeInputSchema,
  jobResumeAnalyzeResultSchema,
  jobResumeRewriteSuggestionsInputSchema,
  jobResumeRewriteSuggestionsResultSchema,
} from "@/modules/jobs/schema";

afterEach(() => {
  setServerAppContextForTesting(undefined);
});

describe("api routes", () => {
  it("registers a user and returns current user for authenticated requests", async () => {
    setServerAppContextForTesting(createTestAppContext());

    const registerResponse = await postRegister(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: "newuser@example.com",
          password: "Password123!",
          name: "新用户",
        }),
      }),
    );

    const registerPayload = await registerResponse.json();
    expect(registerResponse.status).toBe(200);
    expect(registerPayload.data.email).toBe("newuser@example.com");

    const meResponse = await getMe(
      new Request("http://localhost/api/auth/me", {
        headers: {
          "x-user-id": "user-1",
        },
      }),
    );

    const mePayload = await meResponse.json();
    expect(meResponse.status).toBe(200);
    expect(mePayload.data.email).toBe("demo@example.com");
  });

  it("rejects duplicate registration", async () => {
    setServerAppContextForTesting(createTestAppContext());

    const response = await postRegister(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: "demo@example.com",
          password: "Password123!",
          name: "重复用户",
        }),
      }),
    );

    const payload = await response.json();
    expect(response.status).toBe(409);
    expect(payload.error.code).toBe("EMAIL_ALREADY_REGISTERED");
  });

  it("rejects invalid registration payload", async () => {
    setServerAppContextForTesting(createTestAppContext());

    const response = await postRegister(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: "bad",
          password: "123",
          name: "",
        }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("validates the job resume analysis contract shape", () => {
    const input = jobResumeAnalyzeInputSchema.parse({
      rawText: "同济大学计算机科学专业，熟悉 React，希望做前端开发。",
      fileName: "resume.txt",
    });

    const result = jobResumeAnalyzeResultSchema.parse({
      analysis: {
        version: "v1",
        generatedAt: new Date("2026-04-16T08:00:00.000Z").toISOString(),
        overallScore: 76,
        verdict: "partial_match",
        summary: "简历和岗位有一定匹配度，但还需要补强关键证据。",
        matchedRequirements: ["岗位强调 React，你的简历里已经有对应技能信号。"],
        gaps: ["岗位强调 TypeScript，但简历里还缺少直接证据。"],
        resumeRisks: ["缺少量化结果或明确成果指标，竞争力容易被低估。"],
        actionPlan: {
          topPriority: "先补能证明 TypeScript 的项目、课程或实习证据。",
          nextSteps: [
            "补一段能支撑 TypeScript 的经历，并写清任务、动作和结果。",
            "给最关键的一段项目补 1 到 2 个量化结果。",
          ],
        },
      },
      parsed: {
        summary: "识别到前端求职倾向",
        detectedSkills: ["React"],
        detectedJobTypes: ["前端开发"],
        detectedCities: ["上海"],
        education: {
          university: "同济大学",
          major: "计算机科学",
        },
        confidence: 0.88,
      },
      appliedPatch: {
        skills: ["React"],
      },
      profile: {
        userId: "user-1",
        university: "同济大学",
        major: "计算机科学",
        grade: "",
        targetIndustries: [],
        targetCities: ["上海"],
        skills: ["React"],
        preferredJobTypes: ["前端开发"],
        considersPostgraduate: false,
        considersCivilService: false,
        resumeData: null,
      },
    });

    expect(input.fileName).toBe("resume.txt");
    expect(result.analysis.verdict).toBe("partial_match");
    expect(result.analysis.actionPlan.nextSteps).toHaveLength(2);
  });

  it("validates the job resume rewrite suggestions contract shape", () => {
    const input = jobResumeRewriteSuggestionsInputSchema.parse({
      rawText: "同济大学计算机科学专业，熟悉 React，希望做前端开发。",
      fileName: "resume.txt",
    });

    const result = jobResumeRewriteSuggestionsResultSchema.parse({
      rewriteSuggestions: {
        version: "v1",
        generatedAt: new Date("2026-04-17T08:00:00.000Z").toISOString(),
        summary: "建议优先改写简历开头、技能区和最贴近岗位的一段项目经历。",
        headlineSuggestion: "前端开发候选人 | 上海 | React 项目经验与岗位关键词对齐",
        summarySuggestion: "聚焦前端开发方向，已具备 React 等基础能力，希望在上海参与互联网业务场景下的页面与功能建设。",
        keywordSuggestions: ["前端开发", "React", "TypeScript"],
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
            suggestedText: "聚焦前端开发方向，已具备 React 等基础能力，希望在上海参与互联网业务场景下的页面与功能建设。",
          },
        ],
        actionChecklist: [
          "把岗位关键词提前到简历开头和技能区。",
          "优先改写最贴近目标岗位的一段项目经历。",
        ],
      },
      parsed: {
        summary: "识别到前端求职倾向",
        detectedSkills: ["React"],
        detectedJobTypes: ["前端开发"],
        detectedCities: ["上海"],
        education: {
          university: "同济大学",
          major: "计算机科学",
        },
        confidence: 0.88,
      },
      appliedPatch: {
        skills: ["React"],
      },
      profile: {
        userId: "user-1",
        university: "同济大学",
        major: "计算机科学",
        grade: "",
        targetIndustries: [],
        targetCities: ["上海"],
        skills: ["React"],
        preferredJobTypes: ["前端开发"],
        considersPostgraduate: false,
        considersCivilService: false,
        resumeData: null,
      },
    });

    expect(input.fileName).toBe("resume.txt");
    expect(result.rewriteSuggestions.keywordSuggestions).toHaveLength(3);
    expect(result.rewriteSuggestions.sectionSuggestions).toHaveLength(2);
  });

  it("serves profile get and put for authenticated users", async () => {
    setServerAppContextForTesting(createTestAppContext());

    const getResponse = await getProfile(
      new Request("http://localhost/api/profile", {
        headers: {
          "x-user-id": "user-1",
        },
      }),
    );

    const getPayload = await getResponse.json();
    expect(getResponse.status).toBe(200);
    expect(getPayload.data.userId).toBe("user-1");

    const putResponse = await putProfile(
      new Request("http://localhost/api/profile", {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          "x-user-id": "user-1",
        },
        body: JSON.stringify({
          grade: "研一",
        }),
      }),
    );

    const putPayload = await putResponse.json();
    expect(putResponse.status).toBe(200);
    expect(putPayload.data.grade).toBe("研一");
  });

  it("parses resume into profile and applies conservative profile patch", async () => {
    let capturedContext: { requestId?: string | null; userId?: string | null; capability?: string | null } | undefined;
    setServerAppContextForTesting(
      createTestAppContext(
        {},
        {
          aiService: {
            enabled: true,
            async generateDailyAdvice() {
              return {
                advice: {
                  title: "今天先投递高匹配岗位",
                  body: "岗位和方向已经比较清晰，先处理最匹配的职位。",
                  source: "ai",
                },
                meta: {
                  provider: "openai",
                  model: "gpt-test",
                  promptVersion: "v1",
                  latencyMs: 8,
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
                  latencyMs: 12,
                  fallbackUsed: false,
                  tokenUsage: null,
                },
              };
            },
            async parseResume(_input, context) {
              capturedContext = context;
              return {
                parsed: {
                  summary: "识别到技能和方向",
                  detectedSkills: ["Python", "React"],
                  detectedJobTypes: ["前端开发"],
                  detectedCities: ["上海"],
                  education: {
                    university: "同济大学",
                    major: "计算机科学",
                  },
                  confidence: 0.82,
                },
                patch: {
                  university: "同济大学",
                  major: "计算机科学",
                  skills: ["Python", "React"],
                  preferredJobTypes: ["前端开发"],
                  targetCities: ["上海"],
                },
                meta: {
                  provider: "openai",
                  model: "gpt-test",
                  promptVersion: "v1",
                  latencyMs: 25,
                  fallbackUsed: false,
                  tokenUsage: null,
                },
              };
            },
            async diagnoseResume() {
              return {
                diagnosis: {
                  version: "v1",
                  generatedAt: new Date("2026-04-13T10:00:00.000Z").toISOString(),
                  overallScore: 84,
                  summary: "简历基础不错，优先补项目成果和目标岗位表达。",
                  quality: {
                    strengths: ["技能关键词已经比较集中。"],
                    risks: ["缺少量化结果。"],
                    missingInfo: ["项目经历"],
                  },
                  alignment: {
                    targetSummary: "目标岗位偏向 前端开发；优先城市是 上海",
                    matchedSignals: ["简历表达出的岗位方向与画像目标有交集：前端开发。"],
                    gapSignals: [],
                  },
                  actionPlan: {
                    topPriority: "先补一段和前端方向最相关的项目成果。",
                    nextSteps: ["给核心项目补量化结果。", "把目标岗位关键词提前到前半屏。"],
                  },
                },
                meta: {
                  provider: "openai",
                  model: "gpt-test",
                  promptVersion: "v1",
                  latencyMs: 22,
                  fallbackUsed: false,
                  tokenUsage: null,
                },
              };
            },
            async analyzeResumeForJob() {
              throw new Error("not needed");
            },
            async suggestResumeRewriteForJob() {
              throw new Error("not needed");
            },
          },
        },
      ),
    );

    const response = await postProfileResumeParse(
      new Request("http://localhost/api/profile/resume/parse", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-user-id": "user-1",
        },
        body: JSON.stringify({
          rawText: "同济大学计算机科学专业，熟悉 Python、React，希望做前端开发。",
          fileName: "resume.txt",
        }),
      }),
    );

    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toBeTruthy();
    expect(payload.data.parsed.detectedSkills).toContain("Python");
    expect(payload.data.appliedPatch.skills).toContain("Python");
    expect(payload.data.profile.resumeData.parsedResume.fileName).toBe("resume.txt");
    expect(capturedContext?.requestId).toBe(response.headers.get("x-request-id"));
    expect(capturedContext?.userId).toBe("user-1");
    expect(capturedContext?.capability).toBe("resume_parse");
  });

  it("diagnoses resume, refreshes parsed resume cache, and stores latest diagnosis", async () => {
    const capturedContexts: Array<{ requestId?: string | null; userId?: string | null; capability?: string | null }> = [];
    setServerAppContextForTesting(
      createTestAppContext(
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
                  latencyMs: 8,
                  fallbackUsed: false,
                  tokenUsage: null,
                },
              };
            },
            async parseResume(_input, context) {
              capturedContexts.push(context ?? {});
              return {
                parsed: {
                  summary: "识别到技能和方向",
                  detectedSkills: ["Python", "React"],
                  detectedJobTypes: ["前端开发"],
                  detectedCities: ["上海"],
                  education: {
                    university: "同济大学",
                    major: "计算机科学",
                  },
                  confidence: 0.86,
                },
                patch: {
                  skills: ["Python", "React"],
                  preferredJobTypes: ["前端开发"],
                  targetCities: ["上海"],
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
            async diagnoseResume(_input, context) {
              capturedContexts.push(context ?? {});
              return {
                diagnosis: {
                  version: "v1",
                  generatedAt: new Date("2026-04-13T12:00:00.000Z").toISOString(),
                  overallScore: 83,
                  summary: "简历有基础，优先补项目成果和量化证据。",
                  quality: {
                    strengths: ["技能关键词清晰。"],
                    risks: ["缺少量化结果。"],
                    missingInfo: ["项目经历"],
                  },
                  alignment: {
                    targetSummary: "目标岗位偏向 前端开发；优先城市是 上海",
                    matchedSignals: ["简历表达出的岗位方向与画像目标有交集：前端开发。"],
                    gapSignals: [],
                  },
                  actionPlan: {
                    topPriority: "先补一段能证明前端能力的项目成果。",
                    nextSteps: ["补 1 到 2 个量化结果。", "把项目关键词前置。"],
                  },
                },
                meta: {
                  provider: "openai",
                  model: "gpt-test",
                  promptVersion: "v1",
                  latencyMs: 21,
                  fallbackUsed: false,
                  tokenUsage: null,
                },
              };
            },
            async analyzeResumeForJob() {
              throw new Error("not needed");
            },
            async suggestResumeRewriteForJob() {
              throw new Error("not needed");
            },
          },
        },
      ),
    );

    const response = await postProfileResumeDiagnose(
      new Request("http://localhost/api/profile/resume/diagnose", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-user-id": "user-1",
        },
        body: JSON.stringify({
          rawText: "同济大学计算机科学专业，熟悉 Python、React，希望在上海从事前端开发。",
          fileName: "resume.txt",
        }),
      }),
    );

    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.data.diagnosis.overallScore).toBe(83);
    expect(payload.data.profile.resumeData.parsedResume.fileName).toBe("resume.txt");
    expect(payload.data.profile.resumeData.resumeDiagnosis.latest.summary).toContain("项目成果");
    expect(capturedContexts[0]?.capability).toBe("resume_parse");
    expect(capturedContexts[1]?.capability).toBe("resume_diagnosis");
    expect(capturedContexts[1]?.requestId).toBe(response.headers.get("x-request-id"));
  });

  it("returns 503 when resume diagnosis service is unavailable", async () => {
    setServerAppContextForTesting(createTestAppContext());

    const response = await postProfileResumeDiagnose(
      new Request("http://localhost/api/profile/resume/diagnose", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-user-id": "user-1",
        },
        body: JSON.stringify({
          rawText: "一份简历文本",
        }),
      }),
    );

    expect(response.status).toBe(503);
  });

  it("analyzes a resume against a job and only persists parse side effects", async () => {
    const capturedContexts: Array<{ requestId?: string | null; userId?: string | null; capability?: string | null }> =
      [];
    setServerAppContextForTesting(
      createTestAppContext(
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
                  latencyMs: 10,
                  fallbackUsed: false,
                  tokenUsage: null,
                },
              };
            },
            async parseResume(_input, context) {
              capturedContexts.push(context ?? {});
              return {
                parsed: {
                  summary: "识别到前端求职倾向",
                  detectedSkills: ["React"],
                  detectedJobTypes: ["前端开发"],
                  detectedCities: ["上海"],
                  education: {
                    university: "同济大学",
                    major: "计算机科学",
                  },
                  confidence: 0.84,
                },
                patch: {
                  skills: ["React"],
                  preferredJobTypes: ["前端开发"],
                  targetCities: ["上海"],
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
            async diagnoseResume() {
              throw new Error("not needed");
            },
            async analyzeResumeForJob(_input, context) {
              capturedContexts.push(context ?? {});
              return {
                analysis: {
                  version: "v1",
                  generatedAt: new Date("2026-04-16T10:00:00.000Z").toISOString(),
                  overallScore: 74,
                  verdict: "partial_match",
                  summary: "简历和岗位有明显交集，但需要补强 TypeScript 相关证据。",
                  matchedRequirements: ["岗位强调 React，你的简历里已经有对应技能信号。"],
                  gaps: ["岗位强调 TypeScript，但简历里还缺少直接证据。"],
                  resumeRisks: ["缺少量化结果或明确成果指标，竞争力容易被低估。"],
                  actionPlan: {
                    topPriority: "先补能证明 TypeScript 的项目、课程或实习证据。",
                    nextSteps: [
                      "补一段能支撑 TypeScript 的经历，并写清任务、动作和结果。",
                      "给最关键的一段项目补 1 到 2 个量化结果。",
                    ],
                  },
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
            async suggestResumeRewriteForJob() {
              throw new Error("not needed");
            },
          },
        },
      ),
    );

    const response = await postJobResumeAnalyze(
      new Request("http://localhost/api/jobs/job-1/resume/analyze", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-user-id": "user-1",
        },
        body: JSON.stringify({
          rawText: "同济大学计算机科学专业，熟悉 React，希望在上海从事前端开发。",
          fileName: "resume.txt",
        }),
      }),
    );

    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.data.analysis.verdict).toBe("partial_match");
    expect(payload.data.profile.resumeData.parsedResume.fileName).toBe("resume.txt");
    expect(payload.data.profile.resumeData.resumeDiagnosis).toBeUndefined();
    expect(capturedContexts[0]?.capability).toBe("resume_parse");
    expect(capturedContexts[1]?.capability).toBe("job_resume_analysis");
    expect(capturedContexts[1]?.requestId).toBe(response.headers.get("x-request-id"));
  });

  it("returns 404 when job resume analysis targets a missing job", async () => {
    setServerAppContextForTesting(
      createTestAppContext(
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
                  latencyMs: 8,
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
            async suggestResumeRewriteForJob() {
              throw new Error("not needed");
            },
          },
        },
      ),
    );

    const response = await postJobResumeAnalyze(
      new Request("http://localhost/api/jobs/missing-job/resume/analyze", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-user-id": "user-1",
        },
        body: JSON.stringify({
          rawText: "一份简历文本",
        }),
      }),
    );

    expect(response.status).toBe(404);
  });

  it("returns 503 when job resume analysis service is unavailable", async () => {
    setServerAppContextForTesting(createTestAppContext());

    const response = await postJobResumeAnalyze(
      new Request("http://localhost/api/jobs/job-1/resume/analyze", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-user-id": "user-1",
        },
        body: JSON.stringify({
          rawText: "一份简历文本",
        }),
      }),
    );

    expect(response.status).toBe(503);
  });

  it("returns rewrite suggestions for a resume against a job and only persists parse side effects", async () => {
    const capturedContexts: Array<{ requestId?: string | null; userId?: string | null; capability?: string | null }> =
      [];
    setServerAppContextForTesting(
      createTestAppContext(
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
                  latencyMs: 10,
                  fallbackUsed: false,
                  tokenUsage: null,
                },
              };
            },
            async parseResume(_input, context) {
              capturedContexts.push(context ?? {});
              return {
                parsed: {
                  summary: "识别到前端求职倾向",
                  detectedSkills: ["React"],
                  detectedJobTypes: ["前端开发"],
                  detectedCities: ["上海"],
                  education: {
                    university: "同济大学",
                    major: "计算机科学",
                  },
                  confidence: 0.84,
                },
                patch: {
                  skills: ["React"],
                  preferredJobTypes: ["前端开发"],
                  targetCities: ["上海"],
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
            async diagnoseResume() {
              throw new Error("not needed");
            },
            async analyzeResumeForJob() {
              throw new Error("not needed");
            },
            async suggestResumeRewriteForJob(_input, context) {
              capturedContexts.push(context ?? {});
              return {
                rewriteSuggestions: {
                  version: "v1",
                  generatedAt: new Date("2026-04-17T10:00:00.000Z").toISOString(),
                  summary: "建议优先改写简历开头、技能区和最贴近岗位的一段项目经历。",
                  headlineSuggestion: "前端开发候选人 | 上海 | React 项目经验与岗位关键词对齐",
                  summarySuggestion: "聚焦前端开发方向，已具备 React 等基础能力，希望在上海参与互联网业务场景下的页面与功能建设。",
                  keywordSuggestions: ["前端开发", "React", "TypeScript"],
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
                      suggestedText: "聚焦前端开发方向，已具备 React 等基础能力，希望在上海参与互联网业务场景下的页面与功能建设。",
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
                  latencyMs: 18,
                  fallbackUsed: false,
                  tokenUsage: null,
                },
              };
            },
          },
        },
      ),
    );

    const response = await postJobResumeRewriteSuggestions(
      new Request("http://localhost/api/jobs/job-1/resume/rewrite-suggestions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-user-id": "user-1",
        },
        body: JSON.stringify({
          rawText: "同济大学计算机科学专业，熟悉 React，希望在上海从事前端开发。",
          fileName: "resume.txt",
        }),
      }),
    );

    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.data.rewriteSuggestions.keywordSuggestions).toContain("React");
    expect(payload.data.profile.resumeData.parsedResume.fileName).toBe("resume.txt");
    expect(payload.data.profile.resumeData.resumeDiagnosis).toBeUndefined();
    expect(capturedContexts[0]?.capability).toBe("resume_parse");
    expect(capturedContexts[1]?.capability).toBe("job_resume_rewrite");
    expect(capturedContexts[1]?.requestId).toBe(response.headers.get("x-request-id"));
  });

  it("returns 404 when job resume rewrite suggestions target a missing job", async () => {
    setServerAppContextForTesting(
      createTestAppContext(
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
                  latencyMs: 8,
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
            async suggestResumeRewriteForJob() {
              throw new Error("not needed");
            },
          },
        },
      ),
    );

    const response = await postJobResumeRewriteSuggestions(
      new Request("http://localhost/api/jobs/missing-job/resume/rewrite-suggestions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-user-id": "user-1",
        },
        body: JSON.stringify({
          rawText: "一份简历文本",
        }),
      }),
    );

    expect(response.status).toBe(404);
  });

  it("returns 503 when job resume rewrite suggestions service is unavailable", async () => {
    setServerAppContextForTesting(createTestAppContext());

    const response = await postJobResumeRewriteSuggestions(
      new Request("http://localhost/api/jobs/job-1/resume/rewrite-suggestions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-user-id": "user-1",
        },
        body: JSON.stringify({
          rawText: "一份简历文本",
        }),
      }),
    );

    expect(response.status).toBe(503);
  });

  it("rejects invalid profile updates", async () => {
    setServerAppContextForTesting(createTestAppContext());

    const response = await putProfile(
      new Request("http://localhost/api/profile", {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          "x-user-id": "user-1",
        },
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("returns 503 when resume parsing service is unavailable", async () => {
    setServerAppContextForTesting(createTestAppContext());

    const response = await postProfileResumeParse(
      new Request("http://localhost/api/profile/resume/parse", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-user-id": "user-1",
        },
        body: JSON.stringify({
          rawText: "一份简历文本",
        }),
      }),
    );

    expect(response.status).toBe(503);
  });

  it("guards personalized recommendations behind auth", async () => {
    setServerAppContextForTesting(createTestAppContext());

    const response = await getRecommendHome(new Request("http://localhost/api/recommend/home"));
    expect(response.status).toBe(401);
  });

  it("returns sectioned recommendations for authenticated users", async () => {
    setServerAppContextForTesting(createTestAppContext());

    const response = await getRecommendHome(
      new Request("http://localhost/api/recommend/home", {
        headers: {
          "x-user-id": "user-1",
        },
      }),
    );

    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.data.jobs.length).toBeGreaterThan(0);
    expect(payload.data.dailyAdvice).toBeDefined();
    expect(payload.data.featuredCompany?.id).toBe("company-1");
  });

  it("supports jobs, cases, and events list endpoints with pagination", async () => {
    setServerAppContextForTesting(createTestAppContext());

    const jobsResponse = await getJobs(new Request("http://localhost/api/jobs?page=1&limit=2&city=%E4%B8%8A%E6%B5%B7"));
    const jobsPayload = await jobsResponse.json();
    expect(jobsResponse.status).toBe(200);
    expect(jobsPayload.pagination.total).toBeGreaterThanOrEqual(2);

    const casesResponse = await getCases(new Request("http://localhost/api/cases?page=1&limit=1&careerPath=%E5%89%8D%E7%AB%AF%E5%BC%80%E5%8F%91"));
    const casesPayload = await casesResponse.json();
    expect(casesResponse.status).toBe(200);
    expect(casesPayload.data[0].careerPath).toBe("前端开发");

    const eventsResponse = await getEvents(new Request("http://localhost/api/events?page=1&limit=5&city=%E4%B8%8A%E6%B5%B7"));
    const eventsPayload = await eventsResponse.json();
    expect(eventsResponse.status).toBe(200);
    expect(eventsPayload.data[0].city).toBe("上海");
  });

  it("excludes expired jobs from list, home recommendations, and schedule timeline", async () => {
    setServerAppContextForTesting(
      createTestAppContext({
        jobs: [
          {
            id: "job-active",
            title: "有效岗位",
            companyId: "company-1",
            companyName: "星河科技",
            companyIndustry: "互联网",
            workLocation: "上海",
            tags: ["前端"],
            requiredSkills: ["React"],
            description: "仍可投递。",
            isFeatured: true,
            deadline: new Date(Date.now() + 3 * 86_400_000).toISOString(),
            publishedAt: new Date(Date.now() - 1 * 86_400_000).toISOString(),
            popularity: 90,
          },
          {
            id: "job-expired",
            title: "过期岗位",
            companyId: "company-1",
            companyName: "星河科技",
            companyIndustry: "互联网",
            workLocation: "上海",
            tags: ["前端"],
            requiredSkills: ["React"],
            description: "已经截止。",
            isFeatured: true,
            deadline: new Date(Date.now() - 2 * 86_400_000).toISOString(),
            publishedAt: new Date(Date.now() - 10 * 86_400_000).toISOString(),
            popularity: 99,
          },
        ],
      }),
    );

    const jobsResponse = await getJobs(new Request("http://localhost/api/jobs?page=1&limit=10"));
    const jobsPayload = await jobsResponse.json();
    expect(jobsResponse.status).toBe(200);
    expect(jobsPayload.data.map((item: { id: string }) => item.id)).toEqual(["job-active"]);

    const recommendResponse = await getRecommendHome(
      new Request("http://localhost/api/recommend/home", {
        headers: {
          "x-user-id": "user-1",
        },
      }),
    );
    const recommendPayload = await recommendResponse.json();
    expect(recommendResponse.status).toBe(200);
    expect(recommendPayload.data.jobs.some((item: { id: string }) => item.id === "job-expired")).toBe(false);

    const scheduleResponse = await getSchedule(
      new Request("http://localhost/api/schedule", {
        headers: {
          "x-user-id": "user-1",
        },
      }),
    );
    const schedulePayload = await scheduleResponse.json();
    expect(scheduleResponse.status).toBe(200);
    expect(schedulePayload.data.some((item: { id: string }) => item.id === "job-job-expired")).toBe(false);
  });

  it("rejects invalid jobs query parameters", async () => {
    setServerAppContextForTesting(createTestAppContext());

    const response = await getJobs(new Request("http://localhost/api/jobs?page=0&limit=100"));
    expect(response.status).toBe(400);
  });

  it("supports company list and detail endpoints", async () => {
    setServerAppContextForTesting(createTestAppContext());

    const listResponse = await getCompanies(
      new Request("http://localhost/api/companies?page=1&limit=10&city=%E4%B8%8A%E6%B5%B7"),
    );
    const listPayload = await listResponse.json();
    expect(listResponse.status).toBe(200);
    expect(listPayload.data[0].id).toBe("company-1");

    const detailResponse = await getCompany(new Request("http://localhost/api/companies/company-1"));
    const detailPayload = await detailResponse.json();
    expect(detailResponse.status).toBe(200);
    expect(detailPayload.data.name).toBe("星河科技");
  });

  it("returns 404 for unknown company detail", async () => {
    setServerAppContextForTesting(createTestAppContext());

    const response = await getCompany(new Request("http://localhost/api/companies/company-missing"));
    expect(response.status).toBe(404);
  });

  it("serves daily content and advice channels for authenticated users", async () => {
    setServerAppContextForTesting(
      createTestAppContext(
        {},
        {
          aiService: {
            enabled: true,
            async generateDailyAdvice() {
              return {
                advice: {
                  title: "先处理今天最匹配的岗位",
                  body: "你今天适合先投递上海互联网方向的岗位，再补简历细节。",
                  source: "ai",
                },
                meta: {
                  provider: "openai",
                  model: "gpt-test",
                  promptVersion: "v1",
                  latencyMs: 9,
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
                  latencyMs: 9,
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
            async suggestResumeRewriteForJob() {
              throw new Error("not needed");
            },
          },
        },
      ),
    );

    const todayResponse = await getTodayContent(
      new Request("http://localhost/api/daily-content/today", {
        headers: { "x-user-id": "user-1" },
      }),
    );
    const todayPayload = await todayResponse.json();
    expect(todayResponse.status).toBe(200);
    expect(todayPayload.data.dailyAdvice.source).toBe("ai");
    expect(todayPayload.data.dailyAdvice.title).toContain("岗位");

    const postgraduateResponse = await getPostgraduateAdvice(
      new Request("http://localhost/api/postgraduate/advice", {
        headers: { "x-user-id": "user-1" },
      }),
    );
    const postgraduatePayload = await postgraduateResponse.json();
    expect(postgraduateResponse.status).toBe(200);
    expect(postgraduatePayload.data[0].id).toBe("pg-1");

    const civilServiceResponse = await getCivilServiceAdvice(
      new Request("http://localhost/api/civil-service/advice", {
        headers: { "x-user-id": "user-1" },
      }),
    );
    const civilServicePayload = await civilServiceResponse.json();
    expect(civilServiceResponse.status).toBe(200);
    expect(civilServicePayload.data[0].id).toBe("cs-1");
  });

  it("supports schedule timeline read and user plan CRUD", async () => {
    setServerAppContextForTesting(createTestAppContext());

    const timelineResponse = await getSchedule(
      new Request("http://localhost/api/schedule", {
        headers: {
          "x-user-id": "user-1",
        },
      }),
    );
    const timelinePayload = await timelineResponse.json();
    expect(timelineResponse.status).toBe(200);
    expect(timelinePayload.data.length).toBeGreaterThan(0);

    const createResponse = await postSchedule(
      new Request("http://localhost/api/schedule", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-user-id": "user-1",
        },
        body: JSON.stringify({
          title: "模拟面试准备",
          startAt: "2026-04-10T09:00:00.000Z",
          endAt: "2026-04-10T10:00:00.000Z",
          city: "上海",
          description: "准备 3 个项目案例。",
        }),
      }),
    );
    const createPayload = await createResponse.json();
    expect(createResponse.status).toBe(200);
    expect(createPayload.data.source).toBe("user");

    const updateResponse = await putScheduleItem(
      new Request(`http://localhost/api/schedule/${createPayload.data.id}`, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          "x-user-id": "user-1",
        },
        body: JSON.stringify({
          title: "模拟面试复盘",
        }),
      }),
    );
    const updatePayload = await updateResponse.json();
    expect(updateResponse.status).toBe(200);
    expect(updatePayload.data.title).toBe("模拟面试复盘");

    const deleteResponse = await deleteScheduleItem(
      new Request(`http://localhost/api/schedule/${createPayload.data.id}`, {
        method: "DELETE",
        headers: {
          "x-user-id": "user-1",
        },
      }),
    );
    const deletePayload = await deleteResponse.json();
    expect(deleteResponse.status).toBe(200);
    expect(deletePayload.data.deleted).toBe(true);
  });

  it("returns 404 when updating a missing schedule item", async () => {
    setServerAppContextForTesting(createTestAppContext());

    const response = await putScheduleItem(
      new Request("http://localhost/api/schedule/missing-item", {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          "x-user-id": "user-1",
        },
        body: JSON.stringify({
          title: "不会成功",
        }),
      }),
    );

    expect(response.status).toBe(404);
  });

  it("creates and reads ai tasks for the current user", async () => {
    setServerAppContextForTesting(createTestAppContext());

    const createResponse = await postJobResumeRewriteTask(
      new Request("http://localhost/api/jobs/job-1/resume/rewrite-suggestions/tasks", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-user-id": "user-1",
          "x-request-id": "req-task-1",
        },
        body: JSON.stringify({
          rawText: "同济大学计算机科学专业，熟悉 React。",
          fileName: "resume.txt",
        }),
      }),
    );

    const createPayload = await createResponse.json();
    expect(createResponse.status).toBe(200);
    expect(createPayload.data.capability).toBe("job_resume_rewrite");
    expect(createPayload.data.status).toBe("pending");

    const listResponse = await getAiTasks(
      new Request("http://localhost/api/ai/tasks?capability=job_resume_rewrite", {
        headers: {
          "x-user-id": "user-1",
        },
      }),
    );
    const listPayload = await listResponse.json();
    expect(listResponse.status).toBe(200);
    expect(listPayload.data).toHaveLength(1);
    expect(listPayload.data[0].id).toBe(createPayload.data.taskId);

    const getResponse = await getAiTask(
      new Request(`http://localhost/api/ai/tasks/${createPayload.data.taskId}`, {
        headers: {
          "x-user-id": "user-1",
        },
      }),
    );
    const getPayload = await getResponse.json();
    expect(getResponse.status).toBe(200);
    expect(getPayload.data.id).toBe(createPayload.data.taskId);
  });
});
