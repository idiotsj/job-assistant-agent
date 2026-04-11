import { ensureArray } from "@/core/helpers";
import { type DbClient, unsafeQuery } from "@/core/db/client";
import { createWhereBuilder, runPaginatedQuery } from "@/core/db/query-helpers";
import { type ListResult } from "@/modules/shared/types";
import { jobSchema, type Job, type JobListQuery } from "@/modules/jobs/schema";

export interface JobRepository {
  list(query: JobListQuery): Promise<ListResult<Job>>;
  getById(id: string): Promise<Job | null>;
}

const jobSelect = `
  SELECT
    id,
    title,
    company_id AS "companyId",
    company_name AS "companyName",
    company_industry AS "companyIndustry",
    work_location AS "workLocation",
    tags,
    required_skills AS "requiredSkills",
    description,
    is_featured AS "isFeatured",
    deadline,
    published_at AS "publishedAt",
    popularity
`;

export function createJobRepository(db: DbClient): JobRepository {
  return {
    async list(query) {
      const where = createWhereBuilder();

      const cities = ensureArray(query.city);
      if (cities.length > 0) {
        where.addValue(cities, (index) => `work_location = ANY($${index})`);
      }

      const industries = ensureArray(query.industry);
      if (industries.length > 0) {
        where.addValue(industries, (index) => `company_industry = ANY($${index})`);
      }

      if (query.keyword) {
        where.addValue(
          `%${query.keyword}%`,
          (index) => `(title ILIKE $${index} OR company_name ILIKE $${index})`,
        );
      }

      if (query.featuredOnly) {
        where.addRaw(`is_featured = TRUE`);
      }

      const { whereClause, values } = where.build();

      return runPaginatedQuery({
        db,
        select: jobSelect,
        from: "FROM jobs",
        whereClause,
        values,
        orderBy: "ORDER BY is_featured DESC, published_at DESC, popularity DESC",
        page: query.page,
        limit: query.limit,
        schema: jobSchema,
      });
    },

    async getById(id) {
      const rows = await unsafeQuery(
        db,
        `
          ${jobSelect}
          FROM jobs
          WHERE id = $1
          LIMIT 1
        `,
        [id],
      );

      return rows[0] ? jobSchema.parse(rows[0]) : null;
    },
  };
}
