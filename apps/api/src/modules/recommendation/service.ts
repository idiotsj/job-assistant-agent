import type { CaseRepository } from "@/modules/cases/repository";
import type { DailyContentService } from "@/modules/daily-content/service";
import type { EventRepository } from "@/modules/events/repository";
import type { JobRepository } from "@/modules/jobs/repository";
import type { ProfileRepository } from "@/modules/profile/repository";
import type { HomeRecommendation } from "@/modules/recommendation/schema";
import type { AiServiceClient } from "@/integrations/ai-service/client";
import { buildHomeRecommendations } from "@/workflows/recommendation/build-home-recommendations";

export interface RecommendationService {
  getHomeRecommendations(userId: string): Promise<HomeRecommendation>;
}

export function createRecommendationService(
  profileRepository: ProfileRepository,
  jobRepository: JobRepository,
  caseRepository: CaseRepository,
  eventRepository: EventRepository,
  dailyContentService: DailyContentService,
  aiService: AiServiceClient,
): RecommendationService {
  return {
    getHomeRecommendations(userId) {
      return buildHomeRecommendations(userId, {
        profileRepository,
        jobRepository,
        caseRepository,
        eventRepository,
        dailyContentService,
        aiService,
      });
    },
  };
}
