import { AppError } from "@/core/errors/app-error";
import type { AiServiceClient, AiServiceRequestContext } from "@/integrations/ai-service/client";
import { type ProfileRepository } from "@/modules/profile/repository";
import {
  type ParsedResume,
  type ProfilePatch,
  type ProfileResumeParseInput,
  type ProfileResumeParseResult,
  type ProfileUpdateInput,
  type UserProfile,
} from "@/modules/profile/schema";

export interface ProfileService {
  getProfile(userId: string): ReturnType<ProfileRepository["getByUserId"]>;
  saveProfile(userId: string, input: ProfileUpdateInput): ReturnType<ProfileRepository["upsert"]>;
  parseResume(
    userId: string,
    input: ProfileResumeParseInput,
    context?: AiServiceRequestContext,
  ): Promise<ProfileResumeParseResult>;
}

function getEmptyProfile(userId: string): UserProfile {
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
      parsedResume: {
        ...parsed,
        fileName: fileName ?? null,
        parsedAt: new Date().toISOString(),
      },
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

export function createProfileService(repository: ProfileRepository, aiService: AiServiceClient): ProfileService {
  return {
    getProfile(userId) {
      return repository.getByUserId(userId);
    },

    async saveProfile(userId, input) {
      const current =
        (await repository.getByUserId(userId)) ??
        getEmptyProfile(userId);

      return repository.upsert(userId, {
        ...current,
        ...input,
      });
    },

    async parseResume(userId, input, context = {}) {
      const current = (await repository.getByUserId(userId)) ?? getEmptyProfile(userId);

      if (!aiService.enabled) {
        throw new AppError("Resume parsing is temporarily unavailable", {
          code: "AI_SERVICE_UNAVAILABLE",
          status: 503,
        });
      }

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
        throw new AppError("Resume parsing failed", {
          code: "AI_SERVICE_UNAVAILABLE",
          status: 503,
          details: {
            cause: error instanceof Error ? error.message : String(error),
          },
        });
      }

      const appliedPatch = buildResumePatch(current, parsed, suggestedPatch, input.fileName ?? null);
      const profile = await repository.upsert(userId, {
        ...current,
        ...appliedPatch,
      });

      return {
        parsed,
        appliedPatch,
        profile,
      };
    },
  };
}
