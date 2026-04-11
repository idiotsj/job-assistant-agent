import { daysUntil, overlapCount, uniqueBy } from "@/core/helpers";
import { logger } from "@/core/logger";
import type { AiServiceClient, AiServiceRequestContext } from "@/integrations/ai-service/client";
import type { CaseRepository } from "@/modules/cases/repository";
import type { DailyContentService } from "@/modules/daily-content/service";
import type { EventRepository } from "@/modules/events/repository";
import type { JobRepository } from "@/modules/jobs/repository";
import type { ProfileRepository } from "@/modules/profile/repository";
import {
  homeRecommendationSchema,
  type HomeRecommendation,
  type RecommendedCase,
  type RecommendedEvent,
} from "@/modules/recommendation/schema";
import { scoreJobsWithFallback } from "@/workflows/recommendation/score-jobs";

function describeMatch(parts: string[], fallback: string) {
  return parts.length > 0 ? parts.join("，") : fallback;
}

function scoreCases(
  cases: Awaited<ReturnType<CaseRepository["list"]>>["items"],
  profile: Awaited<ReturnType<ProfileRepository["getByUserId"]>>,
): RecommendedCase[] {
  return uniqueBy(
    cases
      .map((studentCase) => {
        let score = 0;
        const reasons: string[] = [];

        if (studentCase.isFeatured) {
          score += 20;
          reasons.push("精选案例");
        }

        if (profile?.preferredJobTypes.includes(studentCase.careerPath)) {
          score += 35;
          reasons.push("方向接近");
        }

        if (profile?.major && studentCase.backgroundMajor === profile.major) {
          score += 25;
          reasons.push("专业接近");
        }

        if (profile?.targetCities.includes(studentCase.city)) {
          score += 10;
          reasons.push("城市接近");
        }

        score += overlapCount(studentCase.tags, profile?.skills ?? []) * 5;

        return {
          ...studentCase,
          score,
          reason: describeMatch(reasons, "热门案例"),
          source: "cases" as const,
        };
      })
      .sort((left, right) => right.score - left.score),
    (item) => item.id,
  ).slice(0, 4);
}

function scoreEvents(
  events: Awaited<ReturnType<EventRepository["list"]>>["items"],
  profile: Awaited<ReturnType<ProfileRepository["getByUserId"]>>,
): RecommendedEvent[] {
  const now = new Date();

  return events
    .map((event) => {
      let score = 0;
      const reasons: string[] = [];

      if (profile?.targetCities.includes(event.city)) {
        score += 40;
        reasons.push("同城活动");
      }

      if (profile?.targetIndustries.includes(event.companyIndustry)) {
        score += 30;
        reasons.push("行业相关");
      }

      if (event.isFeatured) {
        score += 10;
        reasons.push("重点宣讲会");
      }

      const days = daysUntil(event.startAt, now);
      if (days >= 0 && days <= 7) {
        score += 20;
        reasons.push("近期开始");
      }

      return {
        ...event,
        score,
        reason: describeMatch(reasons, "近期活动"),
        source: "events" as const,
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 4);
}

export interface BuildHomeRecommendationsDeps {
  profileRepository: ProfileRepository;
  jobRepository: JobRepository;
  caseRepository: CaseRepository;
  eventRepository: EventRepository;
  dailyContentService: DailyContentService;
  aiService: AiServiceClient;
}

export async function buildHomeRecommendations(
  userId: string,
  deps: BuildHomeRecommendationsDeps,
  context: AiServiceRequestContext = {},
): Promise<HomeRecommendation> {
  const profile = await deps.profileRepository.getByUserId(userId);

  const [primaryJobs, primaryCases, primaryEvents] = await Promise.all([
    deps.jobRepository.list({
      page: 1,
      limit: 30,
      city: profile?.targetCities,
      industry: profile?.targetIndustries,
      keyword: undefined,
      featuredOnly: undefined,
    }),
    deps.caseRepository.list({
      page: 1,
      limit: 20,
      careerPath: profile?.preferredJobTypes[0],
      major: profile?.major || undefined,
    }),
    deps.eventRepository.list({
      page: 1,
      limit: 12,
      city: profile?.targetCities,
      upcomingOnly: true,
    }),
  ]);

  const [jobCandidates, caseCandidates, eventCandidates] = await Promise.all([
    primaryJobs.items.length > 0
      ? primaryJobs
      : deps.jobRepository.list({
          page: 1,
          limit: 30,
          city: undefined,
          industry: undefined,
          keyword: undefined,
          featuredOnly: undefined,
        }),
    primaryCases.items.length > 0
      ? primaryCases
      : deps.caseRepository.list({
          page: 1,
          limit: 20,
          careerPath: undefined,
          major: undefined,
        }),
    primaryEvents.items.length > 0
      ? primaryEvents
      : deps.eventRepository.list({
          page: 1,
          limit: 12,
          city: undefined,
          upcomingOnly: true,
        }),
  ]);

  const fallbackSections = [
    primaryJobs.items.length === 0 ? "jobs" : null,
    primaryCases.items.length === 0 ? "cases" : null,
    primaryEvents.items.length === 0 ? "events" : null,
  ].filter((section): section is "jobs" | "cases" | "events" => Boolean(section));

  const todayContent = await deps.dailyContentService.getTodayContent(profile, context);

  const payload = homeRecommendationSchema.parse({
    jobs: await scoreJobsWithFallback(userId, jobCandidates.items, profile, deps.aiService, context),
    cases: scoreCases(caseCandidates.items, profile),
    events: scoreEvents(eventCandidates.items, profile),
    dailyAdvice: todayContent.dailyAdvice,
    featuredCompany: todayContent.featuredCompany,
  });

  if (fallbackSections.length > 0) {
    logger.warn("Recommendation recall fell back to broader candidates", {
      userId,
      sections: fallbackSections,
    });
  }

  if (payload.jobs.length === 0 || payload.cases.length === 0 || payload.events.length === 0) {
    logger.warn("Recommendation sections fell back to popular content", {
      userId,
      jobs: payload.jobs.length,
      cases: payload.cases.length,
      events: payload.events.length,
    });
  }

  return payload;
}
