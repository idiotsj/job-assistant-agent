import { AppError, NotFoundError } from "@/core/errors/app-error";
import type { AiServiceClient, AiServiceRequestContext } from "@/integrations/ai-service/client";
import type { JobRepository } from "@/modules/jobs/repository";
import { jobResumeAnalyzeResultSchema, type JobResumeAnalyzeInput, type JobResumeAnalyzeResult } from "@/modules/jobs/schema";
import type { ProfileRepository } from "@/modules/profile/repository";
import { getEmptyProfile, resolveResumeParseArtifacts } from "@/modules/profile/resume-sync";

export interface JobResumeAnalysisWorkflow {
  analyze(
    userId: string,
    jobId: string,
    input: JobResumeAnalyzeInput,
    context?: AiServiceRequestContext,
  ): Promise<JobResumeAnalyzeResult>;
}

export interface CreateJobResumeAnalysisWorkflowDeps {
  profileRepository: ProfileRepository;
  jobRepository: JobRepository;
  aiService: AiServiceClient;
}

export function createJobResumeAnalysisWorkflow(
  deps: CreateJobResumeAnalysisWorkflowDeps,
): JobResumeAnalysisWorkflow {
  return {
    async analyze(userId, jobId, input, context = {}) {
      const [job, currentProfile] = await Promise.all([
        deps.jobRepository.getById(jobId),
        deps.profileRepository.getByUserId(userId),
      ]);

      if (!job) {
        throw new NotFoundError("Job not found", { id: jobId });
      }

      if (!deps.aiService.enabled) {
        throw new AppError("Job resume analysis is temporarily unavailable", {
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

      let analysis;
      try {
        const aiResult = await deps.aiService.analyzeResumeForJob(
          {
            rawText: input.rawText,
            parsedResume: parsed,
            profile: nextProfileDraft,
            job,
          },
          {
            ...context,
            userId,
            capability: "job_resume_analysis",
          },
        );
        analysis = aiResult.analysis;
      } catch (error) {
        throw new AppError("Job resume analysis is temporarily unavailable", {
          code: "AI_SERVICE_UNAVAILABLE",
          status: 503,
          details: {
            cause: error instanceof Error ? error.message : String(error),
          },
        });
      }

      const profile = await deps.profileRepository.upsert(userId, nextProfileDraft);

      return jobResumeAnalyzeResultSchema.parse({
        analysis,
        parsed,
        appliedPatch,
        profile,
      });
    },
  };
}
