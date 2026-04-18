import type { AiServiceClient } from "@/integrations/ai-service/client";
import type { ServerRepositories, ServerWorkflows } from "@/app/contracts";
import { createJobResumeAnalysisWorkflow } from "@/workflows/job-resume-analysis/run-job-resume-analysis";
import { createJobResumeRewriteWorkflow } from "@/workflows/job-resume-rewrite/run-job-resume-rewrite";

export function createServerWorkflows(
  repositories: ServerRepositories,
  aiService: AiServiceClient,
): ServerWorkflows {
  return {
    jobResumeAnalysis: createJobResumeAnalysisWorkflow({
      profileRepository: repositories.profile,
      jobRepository: repositories.jobs,
      aiService,
    }),
    jobResumeRewrite: createJobResumeRewriteWorkflow({
      profileRepository: repositories.profile,
      jobRepository: repositories.jobs,
      aiService,
    }),
  };
}
