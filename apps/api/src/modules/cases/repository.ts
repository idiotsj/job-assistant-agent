import { type DbClient, unsafeQuery } from "@/core/db/client";
import { createWhereBuilder, runPaginatedQuery } from "@/core/db/query-helpers";
import { type ListResult } from "@/modules/shared/types";
import { studentCaseSchema, type CaseListQuery, type StudentCase } from "@/modules/cases/schema";

export interface CaseRepository {
  list(query: CaseListQuery): Promise<ListResult<StudentCase>>;
}

const caseSelect = `
  SELECT
    id,
    title,
    career_path AS "careerPath",
    background_major AS "backgroundMajor",
    city,
    tags,
    summary,
    is_featured AS "isFeatured",
    published_at AS "publishedAt"
`;

export function createCaseRepository(db: DbClient): CaseRepository {
  return {
    async list(query) {
      const where = createWhereBuilder();

      if (query.careerPath) {
        where.addValue(query.careerPath, (index) => `career_path = $${index}`);
      }

      if (query.major) {
        where.addValue(query.major, (index) => `background_major = $${index}`);
      }

      const { whereClause, values } = where.build();

      return runPaginatedQuery({
        db,
        select: caseSelect,
        from: "FROM student_cases",
        whereClause,
        values,
        orderBy: "ORDER BY is_featured DESC, published_at DESC",
        page: query.page,
        limit: query.limit,
        schema: studentCaseSchema,
      });
    },
  };
}
