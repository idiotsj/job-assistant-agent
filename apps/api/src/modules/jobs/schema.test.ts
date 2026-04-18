import { describe, expect, it } from "vitest";

import {
  jobResumeAnalyzeInputSchema,
  jobResumeAnalyzeResultSchema,
  jobResumeRewriteSuggestionsInputSchema,
  jobResumeRewriteSuggestionsResultSchema,
} from "@/modules/jobs/schema";

describe("job resume analysis contracts", () => {
  it("validates the public input schema", () => {
    const parsed = jobResumeAnalyzeInputSchema.parse({
      rawText: "同济大学计算机科学专业，熟悉 React，希望在上海从事前端开发。",
      fileName: "resume.txt",
    });

    expect(parsed.rawText).toContain("React");
    expect(parsed.fileName).toBe("resume.txt");
  });

  it("locks the public result structure and verdict enum", () => {
    const parsed = jobResumeAnalyzeResultSchema.parse({
      analysis: {
        version: "v1",
        generatedAt: new Date("2026-04-16T08:30:00.000Z").toISOString(),
        overallScore: 68,
        verdict: "partial_match",
        summary: "简历和岗位有交集，但需要先补强关键证据。",
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
        confidence: 0.85,
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

    expect(parsed.analysis.verdict).toBe("partial_match");
    expect(parsed.analysis.actionPlan.nextSteps).toHaveLength(2);
  });

  it("validates the rewrite suggestions contract shape", () => {
    const input = jobResumeRewriteSuggestionsInputSchema.parse({
      rawText: "同济大学计算机科学专业，熟悉 React，希望在上海从事前端开发。",
      fileName: "resume.txt",
    });

    const parsed = jobResumeRewriteSuggestionsResultSchema.parse({
      rewriteSuggestions: {
        version: "v1",
        generatedAt: new Date("2026-04-17T08:30:00.000Z").toISOString(),
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
        confidence: 0.85,
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
    expect(parsed.rewriteSuggestions.sectionSuggestions).toHaveLength(2);
    expect(parsed.rewriteSuggestions.actionChecklist).toHaveLength(2);
  });
});
