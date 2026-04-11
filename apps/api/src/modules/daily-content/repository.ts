import { type DbClient, unsafeQuery } from "@/core/db/client";
import { dailyContentSchema, type DailyContent } from "@/modules/daily-content/schema";

export interface DailyContentRepository {
  listActive(kind: DailyContent["kind"]): Promise<DailyContent[]>;
}

export function createDailyContentRepository(db: DbClient): DailyContentRepository {
  return {
    async listActive(kind) {
      const rows = await unsafeQuery(
        db,
        `
          SELECT
            id,
            kind,
            title,
            body,
            tags,
            target_industries AS "targetIndustries",
            target_cities AS "targetCities",
            is_featured AS "isFeatured",
            active_from AS "activeFrom",
            active_to AS "activeTo"
          FROM daily_content
          WHERE kind = $1
            AND (active_from IS NULL OR active_from <= NOW())
            AND (active_to IS NULL OR active_to >= NOW())
          ORDER BY is_featured DESC, active_from DESC NULLS LAST
        `,
        [kind],
      );

      return rows.map((row) => dailyContentSchema.parse(row));
    },
  };
}

