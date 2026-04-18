import { AppError, NotFoundError } from "@/core/errors/app-error";
import type { AiServiceClient, AiServiceRequestContext } from "@/integrations/ai-service/client";
import type { JobRepository } from "@/modules/jobs/repository";
import {
  jobResumeRewriteSuggestionsResultSchema,
  type JobResumeRewriteSuggestionsInput,
  type JobResumeRewriteSuggestionsResult,
} from "@/modules/jobs/schema";
import type { ProfileRepository } from "@/modules/profile/repository";
import { getEmptyProfile, resolveResumeParseArtifacts } from "@/modules/profile/resume-sync";

export interface JobResumeRewriteWorkflow {
  suggest(
    userId: string,
    jobId: string,
    input: JobResumeRewriteSuggestionsInput,
    context?: AiServiceRequestContext,
  ): Promise<JobResumeRewriteSuggestionsResult>;
}

export interface CreateJobResumeRewriteWorkflowDeps {
  profileRepository: ProfileRepository;
  jobRepository: JobRepository;
  aiService: AiServiceClient;
}

export function createJobResumeRewriteWorkflow(
  deps: CreateJobResumeRewriteWorkflowDeps,
): JobResumeRewriteWorkflow {
  return {
    async suggest(userId, jobId, input, context = {}) {
      const [job, currentProfile] = await Promise.all([
        deps.jobRepository.getById(jobId),
        deps.profileRepository.getByUserId(userId),
      ]);

      if (!job) {
        throw new NotFoundError("Job not found", { id: jobId });
      }

      if (!deps.aiService.enabled) {
        throw new AppError("Job resume rewrite suggestions are temporarily unavailable", {
          code: "AI_SERVICE_UNAVAILABLE",
          status: 503,
        });
      }

      const current = currentProfile ?? getEmptyProfile(userId);
      const { parsed, appliedPatch, nextProfileDraft } = await resolveResumeParseArtifacts(
        deps.aiService,
        current,
        userId,
        input,
        context,
      );

      let rewriteSuggestions;
      try {
        const aiResult = await deps.aiService.suggestResumeRewriteForJob(
          {
            rawText: input.rawText,
            parsedResume: parsed,
            profile: nextProfileDraft,
            job,
          },
          {
            ...context,
            userId,
            capability: "job_resume_rewrite",
          },
        );
        rewriteSuggestions = aiResult.rewriteSuggestions;
      } catch (error) {
        throw new AppError("Job resume rewrite suggestions are temporarily unavailable", {
          code: "AI_SERVICE_UNAVAILABLE",
          status: 503,
          details: {
            cause: error instanceof Error ? error.message : String(error),
          },
        });
      }

      const profile = await deps.profileRepository.upsert(userId, nextProfileDraft);

      return jobResumeRewriteSuggestionsResultSchema.parse({
        rewriteSuggestions,
        parsed,
        appliedPatch,
        profile,
      });
    },
  };
}
