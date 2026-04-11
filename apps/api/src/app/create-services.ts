import { createAuthService, type AuthServiceOptions } from "@/modules/auth/service";
import { createCasesService } from "@/modules/cases/service";
import { createCivilServiceService } from "@/modules/civil-service/service";
import { createCompaniesService } from "@/modules/companies/service";
import { createDailyContentService } from "@/modules/daily-content/service";
import { createEventsService } from "@/modules/events/service";
import { createAiServiceClient, type AiServiceClient } from "@/integrations/ai-service/client";
import { createJobsService } from "@/modules/jobs/service";
import { createPostgraduateService } from "@/modules/postgraduate/service";
import { createProfileService } from "@/modules/profile/service";
import { createRecommendationService } from "@/modules/recommendation/service";
import { createScheduleService } from "@/modules/schedule/service";

import type { ServerRepositories, ServerServices } from "@/app/contracts";

export interface CreateServerServicesOptions {
  auth?: AuthServiceOptions;
  aiService?: AiServiceClient;
}

export function createServerServices(
  repositories: ServerRepositories,
  options: CreateServerServicesOptions = {},
): ServerServices {
  const dailyContentService = createDailyContentService(
    repositories.dailyContent,
    repositories.companies,
    repositories.jobs,
  );
  const aiService = options.aiService ?? createAiServiceClient();

  return {
    auth: createAuthService(repositories.auth, options.auth),
    profile: createProfileService(repositories.profile, aiService),
    jobs: createJobsService(repositories.jobs),
    companies: createCompaniesService(repositories.companies),
    cases: createCasesService(repositories.cases),
    events: createEventsService(repositories.events),
    dailyContent: dailyContentService,
    postgraduate: createPostgraduateService(repositories.postgraduate),
    civilService: createCivilServiceService(repositories.civilService),
    schedule: createScheduleService(repositories.schedule, repositories.jobs, repositories.events),
    recommendation: createRecommendationService(
      repositories.profile,
      repositories.jobs,
      repositories.cases,
      repositories.events,
      dailyContentService,
      aiService,
    ),
  };
}
