import { type DbClient, unsafeQuery } from "@/core/db/client";
import { normalizeDbRow } from "@/core/db/query-helpers";
import { aiTaskSchema, type AiTask, type AiTaskCapability, type AiTaskError, type AiTaskListQuery, type AiTaskProgress, type AiTaskStatus } from "@/modules/ai-tasks/schema";
import { type ListResult } from "@/modules/shared/types";

interface CreateTaskInput {
  capability: AiTaskCapability;
  userId: string;
  payloadJson: Record<string, unknown>;
  requestId?: string | null;
  scheduledAt?: string | null;
}

export interface ClaimedAiTask {
  id: string;
  capability: AiTaskCapability;
  userId: string;
  payloadJson: Record<string, unknown>;
  requestId: string | null;
}

export interface AiTaskRepository {
  create(input: CreateTaskInput): Promise<AiTask>;
  getByIdForUser(taskId: string, userId: string): Promise<AiTask | null>;
  listByUser(userId: string, query: AiTaskListQuery): Promise<ListResult<AiTask>>;
  claimNext(workerId: string): Promise<ClaimedAiTask | null>;
  markProgress(taskId: string, progress: AiTaskProgress): Promise<void>;
  markSucceeded(taskId: string, result: Record<string, unknown>, progress?: AiTaskProgress | null): Promise<void>;
  markFailed(taskId: string, error: AiTaskError, progress?: AiTaskProgress | null): Promise<void>;
  failStaleRunningTasks(timeoutMs: number, error: AiTaskError): Promise<number>;
}

type AiTaskRow = {
  id: string;
  capability: AiTaskCapability;
  status: AiTaskStatus;
  payloadJson: Record<string, unknown>;
  resultJson: Record<string, unknown> | null;
  errorJson: AiTaskError | null;
  progressJson: AiTaskProgress | null;
  requestId: string | null;
  userId: string;
  retryCount: number;
  scheduledAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function mapTaskRow(row: AiTaskRow): AiTask {
  return aiTaskSchema.parse({
    id: row.id,
    capability: row.capability,
    status: row.status,
    progress: row.progressJson ?? null,
    result: row.resultJson ?? null,
    error: row.errorJson ?? null,
    createdAt: row.createdAt,
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
  });
}

function mapClaimedTask(row: AiTaskRow): ClaimedAiTask {
  return {
    id: row.id,
    capability: row.capability,
    userId: row.userId,
    payloadJson: row.payloadJson,
    requestId: row.requestId,
  };
}

const taskColumns = `
  id,
  capability,
  status,
  payload_json AS "payloadJson",
  result_json AS "resultJson",
  error_json AS "errorJson",
  progress_json AS "progressJson",
  request_id AS "requestId",
  user_id AS "userId",
  retry_count AS "retryCount",
  scheduled_at AS "scheduledAt",
  started_at AS "startedAt",
  finished_at AS "finishedAt",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

export function createAiTaskRepository(db: DbClient): AiTaskRepository {
  return {
    async create(input) {
      const rows = await unsafeQuery<AiTaskRow>(
        db,
        `
          INSERT INTO ai_tasks (
            capability,
            status,
            payload_json,
            request_id,
            user_id,
            scheduled_at
          )
          VALUES ($1, 'pending', $2::jsonb, $3, $4, $5)
          RETURNING
            ${taskColumns}
        `,
        [
          input.capability,
          JSON.stringify(input.payloadJson),
          input.requestId ?? null,
          input.userId,
          input.scheduledAt ?? null,
        ],
      );

      return mapTaskRow(normalizeDbRow(rows[0]!));
    },

    async getByIdForUser(taskId, userId) {
      const rows = await unsafeQuery<AiTaskRow>(
        db,
        `
          SELECT
            ${taskColumns}
          FROM ai_tasks
          WHERE id = $1 AND user_id = $2
          LIMIT 1
        `,
        [taskId, userId],
      );

      return rows[0] ? mapTaskRow(normalizeDbRow(rows[0])) : null;
    },

    async listByUser(userId, query) {
      const values: unknown[] = [userId];
      const clauses = ["user_id = $1"];

      if (query.capability) {
        values.push(query.capability);
        clauses.push(`capability = $${values.length}`);
      }

      if (query.status) {
        values.push(query.status);
        clauses.push(`status = $${values.length}`);
      }

      values.push(query.limit);

      const rows = await unsafeQuery<AiTaskRow>(
        db,
        `
          SELECT
            ${taskColumns}
          FROM ai_tasks
          WHERE ${clauses.join(" AND ")}
          ORDER BY created_at DESC
          LIMIT $${values.length}
        `,
        values,
      );

      return {
        items: rows.map((row) => mapTaskRow(normalizeDbRow(row))),
        total: rows.length,
      };
    },

    async claimNext(workerId) {
      const rows = await unsafeQuery<AiTaskRow>(
        db,
        `
          WITH next_task AS (
            SELECT id
            FROM ai_tasks
            WHERE status = 'pending'
              AND (scheduled_at IS NULL OR scheduled_at <= NOW())
            ORDER BY created_at ASC
            FOR UPDATE SKIP LOCKED
            LIMIT 1
          )
          UPDATE ai_tasks
          SET
            status = 'running',
            started_at = NOW(),
            updated_at = NOW(),
            progress_json = jsonb_build_object(
              'step', 'claimed',
              'message', $1,
              'percent', 0
            )
          WHERE id IN (SELECT id FROM next_task)
          RETURNING
            ${taskColumns}
        `,
        [`Claimed by worker ${workerId}`],
      );

      return rows[0] ? mapClaimedTask(normalizeDbRow(rows[0])) : null;
    },

    async markProgress(taskId, progress) {
      await unsafeQuery(
        db,
        `
          UPDATE ai_tasks
          SET
            progress_json = $2::jsonb,
            updated_at = NOW()
          WHERE id = $1
        `,
        [taskId, JSON.stringify(progress)],
      );
    },

    async markSucceeded(taskId, result, progress = null) {
      await unsafeQuery(
        db,
        `
          UPDATE ai_tasks
          SET
            status = 'succeeded',
            result_json = $2::jsonb,
            error_json = NULL,
            progress_json = $3::jsonb,
            finished_at = NOW(),
            updated_at = NOW()
          WHERE id = $1
        `,
        [taskId, JSON.stringify(result), JSON.stringify(progress)],
      );
    },

    async markFailed(taskId, error, progress = null) {
      await unsafeQuery(
        db,
        `
          UPDATE ai_tasks
          SET
            status = 'failed',
            error_json = $2::jsonb,
            progress_json = $3::jsonb,
            finished_at = NOW(),
            updated_at = NOW()
          WHERE id = $1
        `,
        [taskId, JSON.stringify(error), JSON.stringify(progress)],
      );
    },

    async failStaleRunningTasks(timeoutMs, error) {
      const rows = await unsafeQuery<{ id: string }>(
        db,
        `
          UPDATE ai_tasks
          SET
            status = 'failed',
            error_json = $2::jsonb,
            progress_json = jsonb_build_object(
              'step', 'recovered',
              'message', 'Worker recovered stale running task',
              'percent', 100
            ),
            finished_at = NOW(),
            updated_at = NOW()
          WHERE status = 'running'
            AND started_at IS NOT NULL
            AND started_at <= NOW() - ($1 || ' milliseconds')::interval
          RETURNING id
        `,
        [String(timeoutMs), JSON.stringify(error)],
      );

      return rows.length;
    },
  };
}
