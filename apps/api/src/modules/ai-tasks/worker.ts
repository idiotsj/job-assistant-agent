import { logger } from "@/core/logger";
import { type ServerAppContext } from "@/app/contracts";
import { type AiTaskError, type AiTaskProgress } from "@/modules/ai-tasks/schema";
import { jobResumeRewriteTaskPayloadSchema } from "@/modules/ai-tasks/schema";
import { DEFAULT_TASK_WORKER_ID, TASK_POLL_INTERVAL_MS, TASK_RECOVERY_TIMEOUT_MS } from "@/modules/ai-tasks/constants";
import { AppError, NotFoundError } from "@/core/errors/app-error";

export interface AiTaskWorkerOptions {
  workerId?: string;
  pollIntervalMs?: number;
  recoveryTimeoutMs?: number;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toTaskError(error: unknown): AiTaskError {
  if (error instanceof NotFoundError) {
    return {
      code: "JOB_NOT_FOUND",
      message: error.message,
      details: typeof error.details === "object" && error.details !== null ? (error.details as Record<string, unknown>) : {},
    };
  }

  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
      details: typeof error.details === "object" && error.details !== null ? (error.details as Record<string, unknown>) : {},
    };
  }

  if (error instanceof Error) {
    return {
      code: "TASK_EXECUTION_FAILED",
      message: error.message,
      details: {
        name: error.name,
      },
    };
  }

  return {
    code: "TASK_EXECUTION_FAILED",
    message: "Unknown task execution failure",
    details: {},
  };
}

export async function processSingleAiTask(context: ServerAppContext, workerId = DEFAULT_TASK_WORKER_ID) {
  let claimed;
  try {
    claimed = await context.repositories.aiTasks.claimNext(workerId);
  } catch (error) {
    logger.error("AI task claim failed", {
      workerId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return false;
  }

  if (!claimed) {
    return false;
  }

  const markProgress = async (progress: AiTaskProgress) => {
    await context.repositories.aiTasks.markProgress(claimed.id, progress);
  };

  try {
    switch (claimed.capability) {
      case "job_resume_rewrite": {
        const payload = jobResumeRewriteTaskPayloadSchema.parse(claimed.payloadJson);

        await markProgress({
          step: "prepare",
          message: "Preparing resume rewrite analysis",
          percent: 10,
        });

        const result = await context.workflows.jobResumeRewrite.suggest(
          claimed.userId,
          payload.jobId,
          payload.input,
          {
            requestId: payload.requestId ?? claimed.requestId,
          },
        );

        await context.repositories.aiTasks.markSucceeded(
          claimed.id,
          result as unknown as Record<string, unknown>,
          {
            step: "completed",
            message: "Resume rewrite suggestions ready",
            percent: 100,
          },
        );
        return true;
      }
      default:
        throw new Error(`Unsupported ai task capability: ${claimed.capability}`);
    }
  } catch (error) {
    const normalized = toTaskError(error);
    logger.error("AI task execution failed", {
      workerId,
      taskId: claimed.id,
      capability: claimed.capability,
      code: normalized.code,
      message: normalized.message,
    });
    try {
      await context.repositories.aiTasks.markFailed(claimed.id, normalized, {
        step: "failed",
        message: normalized.message,
        percent: 100,
      });
    } catch (persistError) {
      logger.error("AI task failure state persistence failed", {
        workerId,
        taskId: claimed.id,
        capability: claimed.capability,
        originalCode: normalized.code,
        error: persistError instanceof Error ? persistError.message : String(persistError),
        stack: persistError instanceof Error ? persistError.stack : undefined,
      });
      return false;
    }
    return true;
  }
}

export async function recoverStaleAiTasks(context: ServerAppContext, timeoutMs = TASK_RECOVERY_TIMEOUT_MS) {
  const recovered = await context.repositories.aiTasks.failStaleRunningTasks(timeoutMs, {
    code: "WORKER_TIMEOUT",
    message: "Task timed out and was recovered by worker startup",
    details: {},
  });
  if (recovered > 0) {
    logger.warn("Recovered stale ai tasks", { recovered });
  }
}

export async function runAiTaskWorkerLoop(context: ServerAppContext, options: AiTaskWorkerOptions = {}) {
  const workerId = options.workerId ?? DEFAULT_TASK_WORKER_ID;
  const pollIntervalMs = options.pollIntervalMs ?? TASK_POLL_INTERVAL_MS;
  const recoveryTimeoutMs = options.recoveryTimeoutMs ?? TASK_RECOVERY_TIMEOUT_MS;

  await recoverStaleAiTasks(context, recoveryTimeoutMs);

  logger.info("AI task worker started", { workerId, pollIntervalMs, recoveryTimeoutMs });

  while (true) {
    let processed = false;
    try {
      processed = await processSingleAiTask(context, workerId);
    } catch (error) {
      logger.error("AI task worker loop iteration failed", {
        workerId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }

    if (!processed) {
      await sleep(pollIntervalMs);
    }
  }
}
