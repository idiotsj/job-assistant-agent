import { type DbClient, unsafeQuery } from "@/core/db/client";
import { normalizeDbRow } from "@/core/db/query-helpers";
import { postgraduateAdviceSchema, type PostgraduateAdvice } from "@/modules/postgraduate/schema";

export interface PostgraduateRepository {
  list(): Promise<PostgraduateAdvice[]>;
}

export function createPostgraduateRepository(db: DbClient): PostgraduateRepository {
  return {
    async list() {
      const rows = await unsafeQuery(
        db,
        `
          SELECT
            id,
            title,
            summary,
            action_items AS "actionItems",
            target_majors AS "targetMajors",
            updated_at AS "updatedAt"
          FROM postgraduate_advice
          ORDER BY updated_at DESC
        `,
      );

      return rows.map((row) => postgraduateAdviceSchema.parse(normalizeDbRow(row)));
    },
  };
}
