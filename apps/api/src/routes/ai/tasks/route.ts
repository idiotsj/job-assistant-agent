import type { FastifyRequest } from "fastify";

import { getServerAppContext } from "@/app/context";
import { requireAuth } from "@/core/auth/session";
import { UnauthorizedError } from "@/core/errors/app-error";
import { withErrorHandling } from "@/core/http/route-handler";
import { logger } from "@/core/logger";
import { success } from "@/core/response/json";
import { parseQuery } from "@/core/validation/http";
import {
  aiTaskListQuerySchema,
  aiTaskWsErrorEventSchema,
  aiTaskWsSubscribeMessageSchema,
  aiTaskWsUpdatedEventSchema,
} from "@/modules/ai-tasks/schema";
import { getSession, type SessionUser } from "@/routes/auth/session-bridge";

interface MinimalWebSocket {
  send(data: string): void;
  close(): void;
  on(event: "close", listener: () => void): void;
  on(event: "message", listener: (raw: Buffer | ArrayBuffer | Buffer[]) => void | Promise<void>): void;
}

interface TaskSnapshot {
  status: string;
  progressJson: string;
}

const terminalTaskStatuses = new Set(["succeeded", "failed", "cancelled"]);

function getTaskIdFromPath(request: Request) {
  const segments = new URL(request.url).pathname.split("/").filter(Boolean);
  const tasksIndex = segments.indexOf("tasks");
  return tasksIndex >= 0 ? segments[tasksIndex + 1] ?? "" : "";
}

export const GET_LIST = withErrorHandling(async (request) => {
  const auth = await requireAuth(request);
  const query = parseQuery(request, aiTaskListQuerySchema);
  const result = await getServerAppContext().services.aiTasks.listTasks(auth.user.id, query);
  return success(result.items);
});

export const GET = withErrorHandling(async (request) => {
  const auth = await requireAuth(request);
  const taskId = getTaskIdFromPath(request);
  const task = await getServerAppContext().services.aiTasks.getTask(taskId, auth.user.id);
  return success(task);
});

function writeWsMessage(socket: MinimalWebSocket, payload: unknown) {
  socket.send(JSON.stringify(payload));
}

function getAuthenticatedSessionUser(request: FastifyRequest): SessionUser | null {
  const user = getSession(request).get("authUser") as SessionUser | undefined;
  return user?.id ? user : null;
}

export async function WS(socket: MinimalWebSocket, request: FastifyRequest) {
  const authUser = getAuthenticatedSessionUser(request);
  const requestId = request.id ?? request.headers["x-request-id"]?.toString() ?? null;
  if (!authUser) {
    writeWsMessage(socket, aiTaskWsErrorEventSchema.parse({
      type: "error",
      code: "UNAUTHORIZED",
      message: "Authentication required",
    }));
    socket.close();
    throw new UnauthorizedError();
  }

  let timer: NodeJS.Timeout | undefined;
  let subscribedTaskIds: string[] = [];
  const lastSnapshots = new Map<string, TaskSnapshot>();
  let closed = false;
  let pollInFlight = false;

  const cleanup = () => {
    closed = true;
    if (timer) {
      clearTimeout(timer);
      timer = undefined;
    }
  };

  socket.on("close", cleanup);

  socket.on("message", async (raw: Buffer | ArrayBuffer | Buffer[]) => {
    let message: unknown;
    try {
      message = JSON.parse(String(raw));
    } catch {
      writeWsMessage(socket, aiTaskWsErrorEventSchema.parse({
        type: "error",
        code: "INVALID_MESSAGE",
        message: "Message must be valid JSON",
      }));
      return;
    }

    const parsed = aiTaskWsSubscribeMessageSchema.safeParse(message);
    if (!parsed.success) {
      writeWsMessage(socket, aiTaskWsErrorEventSchema.parse({
        type: "error",
        code: "INVALID_MESSAGE",
        message: "Expected subscribe message",
      }));
      return;
    }

    subscribedTaskIds = parsed.data.taskIds;
    lastSnapshots.clear();
    if (timer) {
      clearTimeout(timer);
    }

    const poll = async () => {
      if (closed || pollInFlight) {
        return;
      }

      pollInFlight = true;

      try {
        for (const taskId of [...subscribedTaskIds]) {
          const task = await getServerAppContext().repositories.aiTasks.getByIdForUser(taskId, authUser.id);
          if (!task) {
            subscribedTaskIds = subscribedTaskIds.filter((candidate) => candidate !== taskId);
            lastSnapshots.delete(taskId);
            continue;
          }

          const nextSnapshot: TaskSnapshot = {
            status: task.status,
            progressJson: JSON.stringify(task.progress ?? null),
          };
          const previousSnapshot = lastSnapshots.get(task.id);
          const didChange =
            !previousSnapshot ||
            previousSnapshot.status !== nextSnapshot.status ||
            previousSnapshot.progressJson !== nextSnapshot.progressJson;

          if (!didChange) {
            if (terminalTaskStatuses.has(task.status)) {
              subscribedTaskIds = subscribedTaskIds.filter((candidate) => candidate !== task.id);
              lastSnapshots.delete(task.id);
            }
            continue;
          }

          lastSnapshots.set(task.id, nextSnapshot);
          writeWsMessage(socket, aiTaskWsUpdatedEventSchema.parse({
            type: "task.updated",
            taskId: task.id,
            status: task.status,
            progress: task.progress,
          }));

          if (terminalTaskStatuses.has(task.status)) {
            subscribedTaskIds = subscribedTaskIds.filter((candidate) => candidate !== task.id);
            lastSnapshots.delete(task.id);
          }
        }
      } catch (error) {
        logger.error("AI task websocket poll failed", {
          requestId,
          userId: authUser.id,
          taskIds: subscribedTaskIds,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });

        writeWsMessage(socket, aiTaskWsErrorEventSchema.parse({
          type: "error",
          code: "TASK_STORE_UNAVAILABLE",
          message: "Task updates are temporarily unavailable",
        }));

        if (timer) {
          clearTimeout(timer);
          timer = undefined;
        }
        socket.close();
        cleanup();
        return;
      } finally {
        pollInFlight = false;
      }

      if (closed || subscribedTaskIds.length === 0) {
        if (timer) {
          clearTimeout(timer);
          timer = undefined;
        }
        return;
      }

      timer = setTimeout(() => {
        void poll();
      }, 1000);
    };

    void poll();

    if (subscribedTaskIds.length === 0 && timer) {
      clearTimeout(timer);
      timer = undefined;
    }
  });
}
