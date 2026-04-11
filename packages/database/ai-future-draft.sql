-- Draft only: async task orchestration and feedback tables for future AI workflows.
-- These tables are intentionally not part of the live V1 schema yet.

CREATE TABLE IF NOT EXISTS ai_tasks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  task_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'succeeded', 'failed', 'cancelled')),
  payload_json JSONB NOT NULL,
  result_json JSONB,
  error_json JSONB,
  request_id TEXT,
  user_id TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_feedback (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  run_log_id TEXT NOT NULL REFERENCES ai_run_logs(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  label TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
