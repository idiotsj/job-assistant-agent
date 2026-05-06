import { NotFoundError, ServiceUnavailableError } from "@/core/errors/app-error";
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

export interface JobResumeRewriteExecutionResult {
  rewriteSuggestions: JobResumeRewriteSuggestionsResult["rewriteSuggestions"];
  parsed: JobResumeRewriteSuggestionsResult["parsed"];
  appliedPatch: JobResumeRewriteSuggestionsResult["appliedPatch"];
  profile: JobResumeRewriteSuggestionsResult["profile"];
}

export interface CreateJobResumeRewriteWorkflowDeps {
  profileRepository: ProfileRepository;
  jobRepository: JobRepository;
  aiService: AiServiceClient;
}

export function createJobResumeRewriteWorkflow(
  deps: CreateJobResumeRewriteWorkflowDeps,
): JobResumeRewriteWorkflow {
  async function executeRewrite(
    userId: string,
    jobId: string,
    input: JobResumeRewriteSuggestionsInput,
    context: AiServiceRequestContext = {},
  ): Promise<JobResumeRewriteExecutionResult> {
    const [job, currentProfile] = await Promise.all([
      deps.jobRepository.getById(jobId),
      deps.profileRepository.getByUserId(userId),
    ]);

    if (!job) {
      throw new NotFoundError("Job not found", { id: jobId });
    }

    if (!deps.aiService.enabled) {
      throw new ServiceUnavailableError(
        "Job resume rewrite suggestions are temporarily unavailable",
        undefined,
        "AI_SERVICE_UNAVAILABLE",
      );
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
      throw new ServiceUnavailableError(
        "Job resume rewrite suggestions are temporarily unavailable",
        {
          cause: error instanceof Error ? error.message : String(error),
        },
        "AI_SERVICE_UNAVAILABLE",
      );
    }

    const profile = await deps.profileRepository.upsert(userId, nextProfileDraft);

    return {
      rewriteSuggestions,
      parsed,
      appliedPatch,
      profile,
    };
  }

  return {
    async suggest(userId, jobId, input, context = {}) {
      const result = await executeRewrite(userId, jobId, input, context);

      return jobResumeRewriteSuggestionsResultSchema.parse({
        rewriteSuggestions: result.rewriteSuggestions,
        parsed: result.parsed,
        appliedPatch: result.appliedPatch,
        profile: result.profile,
      });
    },
  };
}

export async function runJobResumeRewriteExecution(
  deps: CreateJobResumeRewriteWorkflowDeps,
  userId: string,
  jobId: string,
  input: JobResumeRewriteSuggestionsInput,
  context: AiServiceRequestContext = {},
) {
  return createJobResumeRewriteWorkflow(deps).suggest(userId, jobId, input, context);
}
