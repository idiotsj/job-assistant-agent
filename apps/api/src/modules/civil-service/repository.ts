import { type DbClient, unsafeQuery } from "@/core/db/client";
import { normalizeDbRow } from "@/core/db/query-helpers";
import { civilServiceAdviceSchema, type CivilServiceAdvice } from "@/modules/civil-service/schema";

export interface CivilServiceRepository {
  list(): Promise<CivilServiceAdvice[]>;
}

export function createCivilServiceRepository(db: DbClient): CivilServiceRepository {
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
            target_cities AS "targetCities",
            updated_at AS "updatedAt"
          FROM civil_service_advice
          ORDER BY updated_at DESC
        `,
      );

      return rows.map((row) => civilServiceAdviceSchema.parse(normalizeDbRow(row)));
    },
  };
}
