import { AppError } from "@/core/errors/app-error";
import type { AiServiceClient } from "@/integrations/ai-service/client";
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
  parseResume(userId: string, input: ProfileResumeParseInput): Promise<ProfileResumeParseResult>;
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
  fileName?: string | null,
): ProfilePatch {
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

  if (!current.university && parsed.education.university) {
    patch.university = parsed.education.university;
  }

  if (!current.major && parsed.education.major) {
    patch.major = parsed.education.major;
  }

  const mergedSkills = mergeUnique([...current.skills, ...parsed.detectedSkills]);
  if (mergedSkills.length !== current.skills.length) {
    patch.skills = mergedSkills;
  }

  if (current.preferredJobTypes.length === 0 && parsed.detectedJobTypes.length > 0) {
    patch.preferredJobTypes = mergeUnique(parsed.detectedJobTypes);
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

    async parseResume(userId, input) {
      const current = (await repository.getByUserId(userId)) ?? getEmptyProfile(userId);

      if (!aiService.enabled) {
        throw new AppError("Resume parsing is temporarily unavailable", {
          code: "AI_SERVICE_UNAVAILABLE",
          status: 503,
        });
      }

      let parsed: ParsedResume;
      try {
        parsed = await aiService.parseResume(input);
      } catch (error) {
        throw new AppError("Resume parsing failed", {
          code: "AI_SERVICE_UNAVAILABLE",
          status: 503,
          details: {
            cause: error instanceof Error ? error.message : String(error),
          },
        });
      }

      const appliedPatch = buildResumePatch(current, parsed, input.fileName ?? null);
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
