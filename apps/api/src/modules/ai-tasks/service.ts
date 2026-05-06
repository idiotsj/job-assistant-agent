import { NotFoundError } from "@/core/errors/app-error";
import { type AiTaskRepository } from "@/modules/ai-tasks/repository";
import { aiTaskCreatedSchema, aiTaskListQuerySchema, type AiTask, type AiTaskCapability, type AiTaskCreated, type AiTaskListQuery } from "@/modules/ai-tasks/schema";

export interface CreateAiTaskInput {
  capability: AiTaskCapability;
  userId: string;
  payloadJson: Record<string, unknown>;
  requestId?: string | null;
}

export interface AiTaskService {
  createTask(input: CreateAiTaskInput): Promise<AiTaskCreated>;
  getTask(taskId: string, userId: string): Promise<AiTask>;
  listTasks(userId: string, query: unknown): ReturnType<AiTaskRepository["listByUser"]>;
}

export function createAiTaskService(repository: AiTaskRepository): AiTaskService {
  return {
    async createTask(input) {
      const task = await repository.create({
        capability: input.capability,
        userId: input.userId,
        payloadJson: input.payloadJson,
        requestId: input.requestId ?? null,
        scheduledAt: null,
      });

      return aiTaskCreatedSchema.parse({
        taskId: task.id,
        capability: task.capability,
        status: task.status,
      });
    },

    async getTask(taskId, userId) {
      const task = await repository.getByIdForUser(taskId, userId);
      if (!task) {
        throw new NotFoundError("AI task not found", { taskId });
      }
      return task;
    },

    listTasks(userId, query) {
      const parsedQuery: AiTaskListQuery = aiTaskListQuerySchema.parse(query);
      return repository.listByUser(userId, parsedQuery);
    },
  };
}
