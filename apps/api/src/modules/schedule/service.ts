import { NotFoundError } from "@/core/errors/app-error";
import type { EventRepository } from "@/modules/events/repository";
import type { JobRepository } from "@/modules/jobs/repository";
import type { UserProfile } from "@/modules/profile/schema";
import type { ScheduleRepository } from "@/modules/schedule/repository";
import type { ScheduleCreateInput, ScheduleItem, ScheduleUpdateInput } from "@/modules/schedule/schema";
import { buildScheduleTimeline } from "@/workflows/schedule/build-schedule-timeline";

export interface ScheduleService {
  getTimeline(userId: string, profile: UserProfile | null): Promise<ScheduleItem[]>;
  createUserPlan(userId: string, input: ScheduleCreateInput): Promise<ScheduleItem>;
  updateUserPlan(userId: string, id: string, input: ScheduleUpdateInput): Promise<ScheduleItem>;
  deleteUserPlan(userId: string, id: string): Promise<void>;
}

export function createScheduleService(
  repository: ScheduleRepository,
  jobRepository: JobRepository,
  eventRepository: EventRepository,
): ScheduleService {
  return {
    getTimeline(userId, profile) {
      return buildScheduleTimeline(userId, profile, {
        scheduleRepository: repository,
        jobRepository,
        eventRepository,
      });
    },

    createUserPlan(userId, input) {
      return repository.createUserItem(userId, input);
    },

    async updateUserPlan(userId, id, input) {
      const item = await repository.updateUserItem(userId, id, input);
      if (!item) {
        throw new NotFoundError("Schedule item not found", { id });
      }
      return item;
    },

    async deleteUserPlan(userId, id) {
      const deleted = await repository.deleteUserItem(userId, id);
      if (!deleted) {
        throw new NotFoundError("Schedule item not found", { id });
      }
    },
  };
}
