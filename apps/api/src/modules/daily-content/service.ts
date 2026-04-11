import { overlapCount } from "@/core/helpers";
import { type CompanyRepository } from "@/modules/companies/repository";
import { type DailyContentRepository } from "@/modules/daily-content/repository";
import { todayContentSchema, type DailyAdvice, type TodayContent } from "@/modules/daily-content/schema";
import { type JobRepository } from "@/modules/jobs/repository";
import { type UserProfile } from "@/modules/profile/schema";

const genericAdvice: DailyAdvice = {
  title: "先完善画像，再开始今天的投递",
  body: "补全目标城市、目标行业和技能标签后，岗位与案例推荐会明显更精准。",
  source: "fallback",
};

export interface DailyContentService {
  getTodayContent(profile: UserProfile | null): Promise<TodayContent>;
}

export function createDailyContentService(
  repository: DailyContentRepository,
  companyRepository: CompanyRepository,
  jobRepository: JobRepository,
): DailyContentService {
  return {
    async getTodayContent(profile) {
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

      return todayContentSchema.parse({
        dailyAdvice,
        featuredCompany: featuredCompanies[0] ?? null,
        featuredJobs: featuredJobs.items,
      });
    },
  };
}
