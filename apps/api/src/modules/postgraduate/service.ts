import { overlapCount } from "@/core/helpers";
import { type UserProfile } from "@/modules/profile/schema";
import { type PostgraduateRepository } from "@/modules/postgraduate/repository";

export interface PostgraduateService {
  getAdvice(profile: UserProfile | null): ReturnType<PostgraduateRepository["list"]>;
}

export function createPostgraduateService(repository: PostgraduateRepository): PostgraduateService {
  return {
    async getAdvice(profile) {
      const advice = await repository.list();
      if (!profile?.major) {
        return advice.slice(0, 5);
      }

      return advice
        .map((item) => ({
          item,
          score: overlapCount(item.targetMajors, [profile.major]),
        }))
        .sort((left, right) => right.score - left.score)
        .map(({ item }) => item)
        .slice(0, 5);
    },
  };
}

