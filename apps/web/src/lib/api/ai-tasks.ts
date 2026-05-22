import {
  aiTaskCreatedSchema,
  aiTaskListQuerySchema,
  aiTaskSchema,
  aiTaskWsErrorEventSchema,
  aiTaskWsSubscribeMessageSchema,
  aiTaskWsUpdatedEventSchema,
  type AiTask,
  type AiTaskWsErrorEvent,
  type AiTaskWsUpdatedEvent,
} from "@job-assistant/contracts/ai-tasks";
import {
  jobResumeRewriteSuggestionsInputSchema,
} from "@job-assistant/contracts/jobs";
import { createSuccessResponseSchema } from "@job-assistant/contracts/http";

import { apiGet, apiPost } from "./client";

const aiTaskCreatedResponseSchema = createSuccessResponseSchema(aiTaskCreatedSchema);
const aiTaskResponseSchema = createSuccessResponseSchema(aiTaskSchema);
const aiTaskListResponseSchema = createSuccessResponseSchema(aiTaskSchema.array());

export async function createJobResumeRewriteTask(jobId: string, input: unknown) {
  const payload = jobResumeRewriteSuggestionsInputSchema.parse(input);
  const response = await apiPost(
    `/api/jobs/${jobId}/resume/rewrite-suggestions/tasks`,
    payload,
    aiTaskCreatedResponseSchema,
  );
  return response.data;
}

export async function getAiTask(taskId: string) {
  const response = await apiGet(`/api/ai/tasks/${taskId}`, aiTaskResponseSchema);
  return response.data;
}

export async function listAiTasks(query: unknown = {}) {
  const payload = aiTaskListQuerySchema.parse(query);
  const response = await apiGet("/api/ai/tasks", aiTaskListResponseSchema, payload);
  return response.data;
}

export interface SubscribeAiTaskUpdatesOptions {
  taskIds: string[];
  onUpdated: (event: AiTaskWsUpdatedEvent) => void;
  onError?: (event: AiTaskWsErrorEvent) => void;
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
}

function buildWebSocketUrl() {
  if (typeof window === "undefined") {
    throw new Error("WebSocket is only available in the browser");
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/api/ai/tasks/ws`;
}

export function subscribeAiTaskUpdates(options: SubscribeAiTaskUpdatesOptions) {
  const subscription = aiTaskWsSubscribeMessageSchema.parse({
    type: "subscribe",
    taskIds: options.taskIds,
  });

  const socket = new WebSocket(buildWebSocketUrl());

  socket.addEventListener("open", () => {
    socket.send(JSON.stringify(subscription));
    options.onOpen?.();
  });

  socket.addEventListener("message", (event) => {
    let payload: unknown;
    try {
      payload = JSON.parse(String(event.data));
    } catch {
      options.onError?.({
        type: "error",
        code: "INVALID_MESSAGE",
        message: "Task update message must be valid JSON",
      });
      return;
    }

    const updated = aiTaskWsUpdatedEventSchema.safeParse(payload);
    if (updated.success) {
      options.onUpdated(updated.data);
      return;
    }

    const errorEvent = aiTaskWsErrorEventSchema.safeParse(payload);
    if (errorEvent.success) {
      options.onError?.(errorEvent.data);
      return;
    }

    options.onError?.({
      type: "error",
      code: "INVALID_MESSAGE",
      message: "Task update message shape is unsupported",
    });
  });

  socket.addEventListener("close", (event) => {
    options.onClose?.(event);
  });

  socket.addEventListener("error", () => {
    options.onError?.({
      type: "error",
      code: "WEBSOCKET_UNAVAILABLE",
      message: "Task update websocket is unavailable",
    });
  });

  return {
    close() {
      socket.close();
    },
  };
}

export function findLatestAiTaskForJob(tasks: AiTask[], jobId: string, capability = "job_resume_rewrite") {
  return tasks.find((task) => task.capability === capability && task.subject?.kind === "job" && task.subject.id === jobId) ?? null;
}
