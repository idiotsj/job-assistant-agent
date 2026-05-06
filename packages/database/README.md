# Database Assets

Shared PostgreSQL schema, seed scripts, and SQL migrations for the monorepo.

## Layout

- `schema.sql`: baseline schema for local bootstrap
- `seed.sql`: development seed data
- `migrations/`: forward-only SQL patches for existing environments

## Notes

- When updating an existing environment, apply the SQL files in `migrations/` before reseeding.
- `migrations/20260413_add_schedule_items_user_fk.sql` cleans orphaned `schedule_items` rows and then enforces `user_id -> app_users(id)` with `ON DELETE CASCADE`.
- `migrations/20260505_add_ai_tasks.sql` creates the first production `ai_tasks` table and indexes for the async AI task worker.
