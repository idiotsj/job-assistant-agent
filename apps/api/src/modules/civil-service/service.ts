import { overlapCount } from "@/core/helpers";
import { type UserProfile } from "@/modules/profile/schema";
import { type CivilServiceRepository } from "@/modules/civil-service/repository";

export interface CivilServiceService {
  getAdvice(profile: UserProfile | null): ReturnType<CivilServiceRepository["list"]>;
}

export function createCivilServiceService(repository: CivilServiceRepository): CivilServiceService {
  return {
    async getAdvice(profile) {
      const advice = await repository.list();
      if (!profile?.targetCities.length) {
        return advice.slice(0, 5);
      }

      return advice
        .map((item) => ({
          item,
          score: overlapCount(item.targetCities, profile.targetCities),
        }))
        .sort((left, right) => right.score - left.score)
        .map(({ item }) => item)
        .slice(0, 5);
    },
  };
}

