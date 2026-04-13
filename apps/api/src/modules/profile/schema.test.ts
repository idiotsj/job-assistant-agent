import { describe, expect, it } from "vitest";

import {
  profileResumeDiagnoseResultSchema,
  profileUpdateSchema,
  userProfileSchema,
} from "@/modules/profile/schema";

describe("profile schema", () => {
  it("fills defaults for explicit profile fields", () => {
    const parsed = userProfileSchema.parse({
      userId: "user-1",
    });

    expect(parsed.targetIndustries).toEqual([]);
    expect(parsed.targetCities).toEqual([]);
    expect(parsed.skills).toEqual([]);
    expect(parsed.considersPostgraduate).toBe(false);
  });

  it("rejects empty updates", () => {
    const parsed = profileUpdateSchema.safeParse({});
    expect(parsed.success).toBe(false);
  });

  it("accepts the resume diagnosis response shape", () => {
    const parsed = profileResumeDiagnoseResultSchema.parse({
      diagnosis: {
        version: "v1",
        generatedAt: new Date("2026-04-13T12:00:00.000Z").toISOString(),
        overallScore: 82,
        summary: "简历基础不错，优先补项目成果。",
        quality: {
          strengths: ["技能关键词比较清晰。"],
          risks: ["缺少量化结果。"],
          missingInfo: ["项目经历"],
        },
        alignment: {
          targetSummary: "目标岗位偏向 前端开发；优先城市是 上海",
          matchedSignals: ["方向一致。"],
          gapSignals: [],
        },
        actionPlan: {
          topPriority: "先补一段项目成果。",
          nextSteps: ["补充量化结果。"],
        },
      },
      parsed: {
        summary: "识别到前端方向",
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
      },
    });

    expect(parsed.diagnosis.overallScore).toBe(82);
  });
});
