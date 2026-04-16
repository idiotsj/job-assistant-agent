import type { AiServiceClient } from "@/integrations/ai-service/client";
import type { ServerRepositories, ServerWorkflows } from "@/app/contracts";
import { createJobResumeAnalysisWorkflow } from "@/workflows/job-resume-analysis/run-job-resume-analysis";

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
  };
}
