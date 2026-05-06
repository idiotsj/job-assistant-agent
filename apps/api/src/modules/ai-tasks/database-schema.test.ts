import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { describe, expect, it } from "vitest";

const currentDir = dirname(fileURLToPath(import.meta.url));
const databaseRoot = resolve(currentDir, "../../../../../packages/database");

describe("ai tasks database schema", () => {
  it("defines the ai_tasks table in the baseline schema", () => {
    const schemaSql = readFileSync(resolve(databaseRoot, "schema.sql"), "utf8");

    expect(schemaSql).toContain("CREATE TABLE IF NOT EXISTS ai_tasks");
    expect(schemaSql).toContain("capability TEXT NOT NULL CHECK (capability IN ('job_resume_rewrite'))");
    expect(schemaSql).toContain("user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE");
  });

  it("ships a forward migration for ai_tasks in existing environments", () => {
    const migrationSql = readFileSync(
      resolve(databaseRoot, "migrations/20260505_add_ai_tasks.sql"),
      "utf8",
    );

    expect(migrationSql).toContain("CREATE TABLE IF NOT EXISTS ai_tasks");
    expect(migrationSql).toContain("progress_json JSONB");
    expect(migrationSql).toContain("CREATE INDEX IF NOT EXISTS idx_ai_tasks_request_id");
  });
});
