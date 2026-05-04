import { type DbClient, unsafeQuery } from "@/core/db/client";
import { createWhereBuilder, normalizeDbRow, runPaginatedQuery } from "@/core/db/query-helpers";
import { ensureArray } from "@/core/helpers";
import { type ListResult } from "@/modules/shared/types";
import { companySchema, type Company, type CompanyListQuery } from "@/modules/companies/schema";

export interface CompanyRepository {
  list(query: CompanyListQuery): Promise<ListResult<Company>>;
  getById(id: string): Promise<Company | null>;
  listFeatured(limit?: number): Promise<Company[]>;
}

const companySelect = `
  SELECT
    id,
    name,
    industry,
    city,
    description,
    is_featured AS "isFeatured",
    updated_at AS "updatedAt"
`;

export function createCompanyRepository(db: DbClient): CompanyRepository {
  return {
    async list(query) {
      const where = createWhereBuilder();

      const cities = ensureArray(query.city);
      if (cities.length > 0) {
        where.addValue(cities, (index) => `city = ANY($${index})`);
      }

      const industries = ensureArray(query.industry);
      if (industries.length > 0) {
        where.addValue(industries, (index) => `industry = ANY($${index})`);
      }

      if (query.keyword) {
        where.addValue(
          `%${query.keyword}%`,
          (index) => `(name ILIKE $${index} OR description ILIKE $${index})`,
        );
      }

      if (query.featuredOnly) {
        where.addRaw(`is_featured = TRUE`);
      }

      const { whereClause, values } = where.build();

      return runPaginatedQuery({
        db,
        select: companySelect,
        from: "FROM companies",
        whereClause,
        values,
        orderBy: "ORDER BY is_featured DESC, updated_at DESC, name ASC",
        page: query.page,
        limit: query.limit,
        schema: companySchema,
      });
    },

    async getById(id) {
      const rows = await unsafeQuery(
        db,
        `
          ${companySelect}
          FROM companies
          WHERE id = $1
          LIMIT 1
        `,
        [id],
      );

      return rows[0] ? companySchema.parse(normalizeDbRow(rows[0])) : null;
    },

    async listFeatured(limit = 5) {
      const rows = await unsafeQuery(
        db,
        `
          ${companySelect}
          FROM companies
          ORDER BY is_featured DESC, updated_at DESC
          LIMIT $1
        `,
        [limit],
      );

      return rows.map((row) => companySchema.parse(normalizeDbRow(row)));
    },
  };
}
