import { ensureArray } from "@/core/helpers";
import { type DbClient, unsafeQuery } from "@/core/db/client";
import { createWhereBuilder, runPaginatedQuery } from "@/core/db/query-helpers";
import { type ListResult } from "@/modules/shared/types";
import { eventSchema, type CareerEvent, type EventListQuery } from "@/modules/events/schema";

export interface EventRepository {
  list(query: EventListQuery): Promise<ListResult<CareerEvent>>;
}

const eventSelect = `
  SELECT
    id,
    title,
    company_name AS "companyName",
    company_industry AS "companyIndustry",
    city,
    start_at AS "startAt",
    end_at AS "endAt",
    registration_deadline AS "registrationDeadline",
    description,
    is_featured AS "isFeatured"
`;

export function createEventRepository(db: DbClient): EventRepository {
  return {
    async list(query) {
      const where = createWhereBuilder();
      const cities = ensureArray(query.city);

      if (cities.length > 0) {
        where.addValue(cities, (index) => `city = ANY($${index})`);
      }

      if (query.upcomingOnly) {
        where.addRaw(`start_at >= NOW()`);
      }

      const { whereClause, values } = where.build();

      return runPaginatedQuery({
        db,
        select: eventSelect,
        from: "FROM career_events",
        whereClause,
        values,
        orderBy: "ORDER BY start_at ASC, is_featured DESC",
        page: query.page,
        limit: query.limit,
        schema: eventSchema,
      });
    },
  };
}
