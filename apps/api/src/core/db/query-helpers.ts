import type { ZodType } from "zod";

import { type DbClient, unsafeQuery } from "@/core/db/client";
import type { ListResult } from "@/modules/shared/types";

export interface WhereBuilder {
  addRaw(clause: string): void;
  addValue(value: unknown, clauseFactory: (index: number) => string): void;
  build(): { whereClause: string; values: unknown[] };
}

export function createWhereBuilder(initialClauses: string[] = ["1 = 1"]): WhereBuilder {
  const clauses = [...initialClauses];
  const values: unknown[] = [];

  return {
    addRaw(clause) {
      clauses.push(clause);
    },
    addValue(value, clauseFactory) {
      values.push(value);
      clauses.push(clauseFactory(values.length));
    },
    build() {
      return {
        whereClause: clauses.join(" AND "),
        values: [...values],
      };
    },
  };
}

export interface RunPaginatedQueryOptions<T> {
  db: DbClient;
  select: string;
  from: string;
  whereClause: string;
  values: unknown[];
  orderBy: string;
  page: number;
  limit: number;
  schema: ZodType<T>;
}

export async function runPaginatedQuery<T>({
  db,
  select,
  from,
  whereClause,
  values,
  orderBy,
  page,
  limit,
  schema,
}: RunPaginatedQueryOptions<T>): Promise<ListResult<T>> {
  const pagedValues = [...values, limit, (page - 1) * limit];
  const limitIndex = values.length + 1;
  const offsetIndex = values.length + 2;

  const rows = await unsafeQuery(
    db,
    `
      ${select}
      ${from}
      WHERE ${whereClause}
      ${orderBy}
      LIMIT $${limitIndex} OFFSET $${offsetIndex}
    `,
    pagedValues,
  );

  const totalRows = await unsafeQuery<{ count: number }>(
    db,
    `
      SELECT COUNT(*)::int AS count
      ${from}
      WHERE ${whereClause}
    `,
    values,
  );

  return {
    items: rows.map((row) => schema.parse(row)),
    total: totalRows[0]?.count ?? 0,
  };
}
