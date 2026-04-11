import postgres from "postgres";

import { ConfigurationError } from "@/core/errors/app-error";

export type DbRow = Record<string, unknown>;
export type DbClient = ReturnType<typeof postgres>;

let client: DbClient | undefined;

export function getDbClient() {
  if (!process.env.DATABASE_URL) {
    throw new ConfigurationError("DATABASE_URL is required to use PostgreSQL repositories");
  }

  if (!client) {
    client = postgres(process.env.DATABASE_URL, {
      max: 10,
      prepare: false,
    });
  }

  return client;
}

export function unsafeQuery<T extends DbRow = DbRow>(
  sqlClient: DbClient,
  query: string,
  values: unknown[] = [],
) {
  return sqlClient.unsafe(query, values as never[]) as Promise<T[]>;
}

export async function withTransaction<T>(callback: (tx: DbClient) => Promise<T>) {
  const db = getDbClient();
  return db.begin(async (tx) => callback(tx as unknown as DbClient));
}

export async function closeDbClient() {
  if (client) {
    await client.end();
    client = undefined;
  }
}
