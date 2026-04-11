import { isWithinDays, overlapCount } from "@/core/helpers";
import { logger } from "@/core/logger";
import type { AiServiceClient } from "@/integrations/ai-service/client";
import type { RecommendedJob } from "@/modules/recommendation/schema";
import type { JobRepository } from "@/modules/jobs/repository";
import type { ProfileRepository } from "@/modules/profile/repository";

function describeMatch(parts: string[], fallback: string) {
  return parts.length > 0 ? parts.join("，") : fallback;
}

function scoreJobsRuleBased(
  jobs: Awaited<ReturnType<JobRepository["list"]>>["items"],
  profile: Awaited<ReturnType<ProfileRepository["getByUserId"]>>,
): RecommendedJob[] {
  const now = new Date();

  return jobs
    .map((job) => {
      let score = 0;
      const reasons: string[] = [];

      if (profile?.targetIndustries.includes(job.companyIndustry)) {
        score += 35;
        reasons.push("行业匹配");
      }

      if (profile?.targetCities.includes(job.workLocation)) {
        score += 25;
        reasons.push("城市匹配");
      }

      const skillOverlap = overlapCount(job.requiredSkills, profile?.skills ?? []);
      if (job.requiredSkills.length > 0) {
        const skillScore = Math.round((skillOverlap / job.requiredSkills.length) * 25);
        score += skillScore;
        if (skillScore > 0) {
          reasons.push("技能匹配");
        }
      }

      if (job.isFeatured) {
        score += 10;
        reasons.push("精选岗位");
      }

      if (isWithinDays(job.publishedAt, 7, now)) {
        score += 5;
        reasons.push("近期发布");
      }

      if (isWithinDays(job.deadline, 7, now)) {
        score += 5;
        reasons.push("即将截止");
      }

      return {
        ...job,
        score,
        reason: describeMatch(reasons, "最新岗位"),
        source: "jobs" as const,
      };
    })
    .sort((left, right) => right.score - left.score || right.popularity - left.popularity);
}

function rerankJobs(items: RecommendedJob[]) {
  const companyCounts = new Map<string, number>();
  const ranked: RecommendedJob[] = [];

  for (const item of items) {
    const current = companyCounts.get(item.companyId) ?? 0;
    if (current >= 2) {
      continue;
    }

    companyCounts.set(item.companyId, current + 1);
    ranked.push(item);
    if (ranked.length >= 6) {
      break;
    }
  }

  return ranked;
}

export async function scoreJobsWithFallback(
  userId: string,
  jobs: Awaited<ReturnType<JobRepository["list"]>>["items"],
  profile: Awaited<ReturnType<ProfileRepository["getByUserId"]>>,
  aiService: AiServiceClient,
): Promise<RecommendedJob[]> {
  const ruleBased = scoreJobsRuleBased(jobs, profile);

  if (!aiService.enabled || ruleBased.length === 0) {
    return rerankJobs(ruleBased);
  }

  try {
    const aiScores = await aiService.scoreJobs({
      profile,
      jobs,
    });

    if (aiScores.length === 0) {
      logger.warn("AI job scoring returned no candidates; using TypeScript ranking", { userId });
      return rerankJobs(ruleBased);
    }

    const scoreMap = new Map(aiScores.map((item) => [item.jobId, item]));

    const merged = ruleBased
      .map((job) => {
        const aiScore = scoreMap.get(job.id);
        if (!aiScore) {
          return job;
        }

        return {
          ...job,
          score: aiScore.score,
          reason: aiScore.reason || job.reason,
        };
      })
      .sort((left, right) => right.score - left.score || right.popularity - left.popularity);

    return rerankJobs(merged);
  } catch (error) {
    logger.warn("AI job scoring failed; using TypeScript ranking", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return rerankJobs(ruleBased);
  }
}
