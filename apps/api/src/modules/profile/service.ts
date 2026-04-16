import { AppError } from "@/core/errors/app-error";
import type { AiServiceClient, AiServiceRequestContext } from "@/integrations/ai-service/client";
import { type ProfileRepository } from "@/modules/profile/repository";
import { getEmptyProfile, resolveResumeParseArtifacts } from "@/modules/profile/resume-sync";
import {
  type ProfileResumeDiagnoseInput,
  type ProfileResumeDiagnoseResult,
  type ProfileResumeParseInput,
  type ProfileResumeParseResult,
  type ProfileUpdateInput,
  type ResumeDiagnosis,
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
  diagnoseResume(
    userId: string,
    input: ProfileResumeDiagnoseInput,
    context?: AiServiceRequestContext,
  ): Promise<ProfileResumeDiagnoseResult>;
}

function applyLatestResumeDiagnosis(profile: UserProfile, diagnosis: ResumeDiagnosis): UserProfile {
  return {
    ...profile,
    resumeData: {
      ...(profile.resumeData ?? {}),
      resumeDiagnosis: {
        latest: diagnosis,
      },
    },
  };
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

      const { parsed, appliedPatch, nextProfileDraft } = await resolveResumeParseArtifacts(
        aiService,
        current,
        userId,
        input,
        context,
      );
      const profile = await repository.upsert(userId, nextProfileDraft);

      return {
        parsed,
        appliedPatch,
        profile,
      };
    },

    async diagnoseResume(userId, input, context = {}) {
      const current = (await repository.getByUserId(userId)) ?? getEmptyProfile(userId);

      if (!aiService.enabled) {
        throw new AppError("Resume diagnosis is temporarily unavailable", {
          code: "AI_SERVICE_UNAVAILABLE",
          status: 503,
        });
      }

      const { parsed, appliedPatch, nextProfileDraft } = await resolveResumeParseArtifacts(
        aiService,
        current,
        userId,
        input,
        context,
      );

      let diagnosis: ResumeDiagnosis;
      try {
        const aiResult = await aiService.diagnoseResume(
          {
            rawText: input.rawText,
            parsedResume: parsed,
            profile: nextProfileDraft,
          },
          {
            ...context,
            userId,
            capability: "resume_diagnosis",
          },
        );
        diagnosis = aiResult.diagnosis;
      } catch (error) {
        throw new AppError("Resume diagnosis is temporarily unavailable", {
          code: "AI_SERVICE_UNAVAILABLE",
          status: 503,
          details: {
            cause: error instanceof Error ? error.message : String(error),
          },
        });
      }

      const nextProfile = applyLatestResumeDiagnosis(nextProfileDraft, diagnosis);
      const profile = await repository.upsert(userId, nextProfile);

      return {
        diagnosis,
        parsed,
        appliedPatch,
        profile,
      };
    },
  };
}
