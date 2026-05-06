import { ServiceUnavailableError } from "@/core/errors/app-error";
import type { AiServiceClient, AiServiceRequestContext } from "@/integrations/ai-service/client";
import type {
  ParsedResume,
  ProfilePatch,
  ProfileResumeParseInput,
  UserProfile,
} from "@/modules/profile/schema";

export function getEmptyProfile(userId: string): UserProfile {
  return {
    userId,
    university: "",
    major: "",
    grade: "",
    targetIndustries: [],
    targetCities: [],
    skills: [],
    preferredJobTypes: [],
    considersPostgraduate: false,
    considersCivilService: false,
    resumeData: null,
  };
}

function mergeUnique(values: string[]) {
  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)));
}

function buildParsedResumeSnapshot(parsed: ParsedResume, fileName?: string | null) {
  return {
    ...parsed,
    fileName: fileName ?? null,
    parsedAt: new Date().toISOString(),
  };
}

function buildResumePatch(
  current: UserProfile,
  parsed: ParsedResume,
  suggestedPatch: ProfilePatch | null,
  fileName?: string | null,
): ProfilePatch {
  const patchSkills = mergeUnique([...(suggestedPatch?.skills ?? []), ...parsed.detectedSkills]);
  const patchJobTypes = mergeUnique([...(suggestedPatch?.preferredJobTypes ?? []), ...parsed.detectedJobTypes]);
  const patchCities = mergeUnique([...(suggestedPatch?.targetCities ?? []), ...parsed.detectedCities]);
  const patch: ProfilePatch = {
    resumeData: {
      ...(current.resumeData ?? {}),
      parsedResume: buildParsedResumeSnapshot(parsed, fileName),
    },
  };

  if (!current.university && (suggestedPatch?.university || parsed.education.university)) {
    patch.university = suggestedPatch?.university ?? parsed.education.university ?? undefined;
  }

  if (!current.major && (suggestedPatch?.major || parsed.education.major)) {
    patch.major = suggestedPatch?.major ?? parsed.education.major ?? undefined;
  }

  const mergedSkills = mergeUnique([...current.skills, ...patchSkills]);
  if (mergedSkills.length !== current.skills.length) {
    patch.skills = mergedSkills;
  }

  if (current.preferredJobTypes.length === 0 && patchJobTypes.length > 0) {
    patch.preferredJobTypes = patchJobTypes;
  }

  if (current.targetCities.length === 0 && patchCities.length > 0) {
    patch.targetCities = patchCities;
  }

  return patch;
}

export interface ResumeParseArtifacts {
  parsed: ParsedResume;
  suggestedPatch: ProfilePatch | null;
  appliedPatch: ProfilePatch;
  nextProfileDraft: UserProfile;
}

export async function resolveResumeParseArtifacts(
  aiService: AiServiceClient,
  current: UserProfile,
  userId: string,
  input: ProfileResumeParseInput,
  context: AiServiceRequestContext,
): Promise<ResumeParseArtifacts> {
  let parsed: ParsedResume;
  let suggestedPatch: ProfilePatch | null = null;
  try {
    const aiResult = await aiService.parseResume(input, {
      ...context,
      userId,
      capability: context.capability ?? "resume_parse",
    });
    parsed = aiResult.parsed;
    suggestedPatch = aiResult.patch;
  } catch (error) {
    throw new ServiceUnavailableError(
      "Resume parsing failed",
      {
        cause: error instanceof Error ? error.message : String(error),
      },
      "AI_SERVICE_UNAVAILABLE",
    );
  }

  const appliedPatch = buildResumePatch(current, parsed, suggestedPatch, input.fileName ?? null);
  return {
    parsed,
    suggestedPatch,
    appliedPatch,
    nextProfileDraft: {
      ...current,
      ...appliedPatch,
    },
  };
}
