import { z } from "zod";

const profileFieldSchemas = {
  university: z.string(),
  major: z.string(),
  grade: z.string(),
  targetIndustries: z.array(z.string()),
  targetCities: z.array(z.string()),
  skills: z.array(z.string()),
  preferredJobTypes: z.array(z.string()),
  considersPostgraduate: z.boolean(),
  considersCivilService: z.boolean(),
  resumeData: z.record(z.string(), z.unknown()).nullable(),
};

export const profilePatchSchema = z.object(profileFieldSchemas).partial();

export const userProfileSchema = z.object({
  userId: z.string(),
  university: profileFieldSchemas.university.default(""),
  major: profileFieldSchemas.major.default(""),
  grade: profileFieldSchemas.grade.default(""),
  targetIndustries: profileFieldSchemas.targetIndustries.default([]),
  targetCities: profileFieldSchemas.targetCities.default([]),
  skills: profileFieldSchemas.skills.default([]),
  preferredJobTypes: profileFieldSchemas.preferredJobTypes.default([]),
  considersPostgraduate: profileFieldSchemas.considersPostgraduate.default(false),
  considersCivilService: profileFieldSchemas.considersCivilService.default(false),
  resumeData: profileFieldSchemas.resumeData.default(null),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const profileUpdateSchema = z
  .object(profileFieldSchemas)
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one profile field must be provided",
  });

export const parsedResumeSchema = z.object({
  summary: z.string(),
  detectedSkills: z.array(z.string()).default([]),
  detectedJobTypes: z.array(z.string()).default([]),
  detectedCities: z.array(z.string()).default([]),
  education: z.object({
    university: z.string().nullable(),
    major: z.string().nullable(),
  }),
  confidence: z.number(),
});

export const profileResumeParseInputSchema = z.object({
  rawText: z.string().min(1),
  fileName: z.string().nullable().optional(),
});

export const resumeDiagnosisQualitySchema = z.object({
  strengths: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
  missingInfo: z.array(z.string()).default([]),
});

export const resumeDiagnosisAlignmentSchema = z.object({
  targetSummary: z.string(),
  matchedSignals: z.array(z.string()).default([]),
  gapSignals: z.array(z.string()).default([]),
});

export const resumeDiagnosisActionPlanSchema = z.object({
  topPriority: z.string(),
  nextSteps: z.array(z.string()).default([]),
});

export const resumeDiagnosisSchema = z.object({
  version: z.string(),
  generatedAt: z.string(),
  overallScore: z.number().int().min(0).max(100),
  summary: z.string(),
  quality: resumeDiagnosisQualitySchema,
  alignment: resumeDiagnosisAlignmentSchema,
  actionPlan: resumeDiagnosisActionPlanSchema,
});

export const profileResumeParseResultSchema = z.object({
  parsed: parsedResumeSchema,
  appliedPatch: profilePatchSchema,
  profile: userProfileSchema,
});

export const profileResumeDiagnoseInputSchema = profileResumeParseInputSchema;

export const profileResumeDiagnoseResultSchema = z.object({
  diagnosis: resumeDiagnosisSchema,
  parsed: parsedResumeSchema,
  appliedPatch: profilePatchSchema,
  profile: userProfileSchema,
});

export type UserProfile = z.infer<typeof userProfileSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type ProfilePatch = z.infer<typeof profilePatchSchema>;
export type ParsedResume = z.infer<typeof parsedResumeSchema>;
export type ProfileResumeParseInput = z.infer<typeof profileResumeParseInputSchema>;
export type ProfileResumeParseResult = z.infer<typeof profileResumeParseResultSchema>;
export type ResumeDiagnosisQuality = z.infer<typeof resumeDiagnosisQualitySchema>;
export type ResumeDiagnosisAlignment = z.infer<typeof resumeDiagnosisAlignmentSchema>;
export type ResumeDiagnosisActionPlan = z.infer<typeof resumeDiagnosisActionPlanSchema>;
export type ResumeDiagnosis = z.infer<typeof resumeDiagnosisSchema>;
export type ProfileResumeDiagnoseInput = z.infer<typeof profileResumeDiagnoseInputSchema>;
export type ProfileResumeDiagnoseResult = z.infer<typeof profileResumeDiagnoseResultSchema>;
