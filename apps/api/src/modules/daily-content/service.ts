import { overlapCount } from "@/core/helpers";
import { logger } from "@/core/logger";
import { type CompanyRepository } from "@/modules/companies/repository";
import { type DailyContentRepository } from "@/modules/daily-content/repository";
import { todayContentSchema, type DailyAdvice, type TodayContent } from "@/modules/daily-content/schema";
import type { AiServiceClient, AiServiceRequestContext } from "@/integrations/ai-service/client";
import { type JobRepository } from "@/modules/jobs/repository";
import { type UserProfile } from "@/modules/profile/schema";

const genericAdvice: DailyAdvice = {
  title: "先完善画像，再开始今天的投递",
  body: "补全目标城市、目标行业和技能标签后，岗位与案例推荐会明显更精准。",
  source: "fallback",
};

export interface DailyContentService {
  getTodayContent(profile: UserProfile | null, context?: AiServiceRequestContext): Promise<TodayContent>;
}

export function createDailyContentService(
  repository: DailyContentRepository,
  companyRepository: CompanyRepository,
  jobRepository: JobRepository,
  aiService: AiServiceClient,
): DailyContentService {
  return {
    async getTodayContent(profile, context = {}) {
      const [adviceCandidates, featuredCompanies, featuredJobs] = await Promise.all([
        repository.listActive("advice"),
        companyRepository.listFeatured(1),
        jobRepository.list({
          page: 1,
          limit: 3,
          featuredOnly: true,
          city: profile?.targetCities,
          industry: profile?.targetIndustries,
          keyword: undefined,
        }),
      ]);

      const bestAdvice = adviceCandidates
        .map((item) => ({
          item,
          score:
            overlapCount(item.targetIndustries, profile?.targetIndustries ?? []) * 2 +
            overlapCount(item.targetCities, profile?.targetCities ?? []),
        }))
        .sort((left, right) => right.score - left.score || Number(right.item.isFeatured) - Number(left.item.isFeatured))[0]?.item;

      const dailyAdvice: DailyAdvice = bestAdvice
        ? {
            title: bestAdvice.title,
            body: bestAdvice.body,
            source: "curated",
          }
        : genericAdvice;

      let resolvedDailyAdvice = dailyAdvice;
      if (aiService.enabled && (profile || bestAdvice || featuredCompanies[0] || featuredJobs.items.length > 0)) {
        try {
          const aiResult = await aiService.generateDailyAdvice(
            {
              profile,
              curatedAdvice: bestAdvice
                ? {
                    title: bestAdvice.title,
                    body: bestAdvice.body,
                  }
                : null,
              featuredCompany: featuredCompanies[0] ?? null,
              featuredJobs: featuredJobs.items,
            },
            {
              ...context,
              userId: context.userId ?? profile?.userId ?? null,
              capability: context.capability ?? "daily_advice",
            },
          );
          resolvedDailyAdvice = aiResult.advice;
        } catch (error) {
          logger.warn("AI daily advice generation failed; using fallback advice", {
            userId: context.userId ?? profile?.userId ?? null,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      return todayContentSchema.parse({
        dailyAdvice: resolvedDailyAdvice,
        featuredCompany: featuredCompanies[0] ?? null,
        featuredJobs: featuredJobs.items,
      });
    },
  };
}
