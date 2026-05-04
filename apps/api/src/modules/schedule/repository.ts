import { randomUUID } from "node:crypto";

import { type DbClient, unsafeQuery } from "@/core/db/client";
import { normalizeDbRow } from "@/core/db/query-helpers";
import {
  scheduleCreateInputSchema,
  scheduleItemSchema,
  scheduleUpdateInputSchema,
  type ScheduleCreateInput,
  type ScheduleItem,
  type ScheduleUpdateInput,
} from "@/modules/schedule/schema";

export interface ScheduleRepository {
  listByUserId(userId: string): Promise<ScheduleItem[]>;
  getUserItemById(userId: string, id: string): Promise<ScheduleItem | null>;
  createUserItem(userId: string, input: ScheduleCreateInput): Promise<ScheduleItem>;
  updateUserItem(userId: string, id: string, input: ScheduleUpdateInput): Promise<ScheduleItem | null>;
  deleteUserItem(userId: string, id: string): Promise<boolean>;
}

export function createScheduleRepository(db: DbClient): ScheduleRepository {
  return {
    async listByUserId(userId) {
      const rows = await unsafeQuery(
        db,
        `
          SELECT
            id,
            title,
            source,
            start_at AS "startAt",
            end_at AS "endAt",
            city,
            description
          FROM schedule_items
          WHERE user_id = $1
          ORDER BY start_at ASC
        `,
        [userId],
      );

      return rows.map((row) => scheduleItemSchema.parse(normalizeDbRow(row)));
    },

    async getUserItemById(userId, id) {
      const rows = await unsafeQuery(
        db,
        `
          SELECT
            id,
            title,
            source,
            start_at AS "startAt",
            end_at AS "endAt",
            city,
            description
          FROM schedule_items
          WHERE user_id = $1 AND id = $2 AND source = 'user'
          LIMIT 1
        `,
        [userId, id],
      );

      return rows[0] ? scheduleItemSchema.parse(normalizeDbRow(rows[0])) : null;
    },

    async createUserItem(userId, input) {
      const normalized = scheduleCreateInputSchema.parse(input);
      const id = randomUUID();
      const rows = await unsafeQuery(
        db,
        `
          INSERT INTO schedule_items (
            id,
            user_id,
            title,
            source,
            start_at,
            end_at,
            city,
            description
          )
          VALUES ($1, $2, $3, 'user', $4, $5, $6, $7)
          RETURNING
            id,
            title,
            source,
            start_at AS "startAt",
            end_at AS "endAt",
            city,
            description
        `,
        [id, userId, normalized.title, normalized.startAt, normalized.endAt, normalized.city, normalized.description],
      );

      return scheduleItemSchema.parse(normalizeDbRow(rows[0]));
    },

    async updateUserItem(userId, id, input) {
      const existing = await this.getUserItemById(userId, id);
      if (!existing) {
        return null;
      }

      const normalized = scheduleUpdateInputSchema.parse(input);
      const merged = {
        ...existing,
        ...normalized,
      };

      const rows = await unsafeQuery(
        db,
        `
          UPDATE schedule_items
          SET
            title = $3,
            start_at = $4,
            end_at = $5,
            city = $6,
            description = $7
          WHERE user_id = $1 AND id = $2 AND source = 'user'
          RETURNING
            id,
            title,
            source,
            start_at AS "startAt",
            end_at AS "endAt",
            city,
            description
        `,
        [userId, id, merged.title, merged.startAt, merged.endAt, merged.city, merged.description],
      );

      return rows[0] ? scheduleItemSchema.parse(normalizeDbRow(rows[0])) : null;
    },

    async deleteUserItem(userId, id) {
      const rows = await unsafeQuery<{ count: number }>(
        db,
        `
          DELETE FROM schedule_items
          WHERE user_id = $1 AND id = $2 AND source = 'user'
          RETURNING 1::int AS count
        `,
        [userId, id],
      );

      return rows.length > 0;
    },
  };
}
