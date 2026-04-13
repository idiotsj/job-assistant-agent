import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { describe, expect, it } from "vitest";

const currentDir = dirname(fileURLToPath(import.meta.url));
const databaseRoot = resolve(currentDir, "../../../../../packages/database");

describe("schedule database schema", () => {
  it("enforces schedule_items.user_id foreign key with cascade delete", () => {
    const schemaSql = readFileSync(resolve(databaseRoot, "schema.sql"), "utf8");

    expect(schemaSql).toContain("user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE");
  });

  it("ships a migration that repairs orphans before adding the foreign key", () => {
    const migrationSql = readFileSync(
      resolve(databaseRoot, "migrations/20260413_add_schedule_items_user_fk.sql"),
      "utf8",
    );

    expect(migrationSql).toContain("DELETE FROM schedule_items");
    expect(migrationSql).toContain("ADD CONSTRAINT schedule_items_user_id_fkey");
    expect(migrationSql).toContain("ON DELETE CASCADE");
  });
});
