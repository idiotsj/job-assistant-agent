CREATE TABLE IF NOT EXISTS ai_tasks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  capability TEXT NOT NULL CHECK (capability IN ('job_resume_rewrite')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'succeeded', 'failed', 'cancelled')),
  payload_json JSONB NOT NULL,
  result_json JSONB,
  error_json JSONB,
  progress_json JSONB,
  request_id TEXT,
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  retry_count INTEGER NOT NULL DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_tasks_user_id_created_at
  ON ai_tasks (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_tasks_status_created_at
  ON ai_tasks (status, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_ai_tasks_capability_status_created_at
  ON ai_tasks (capability, status, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_ai_tasks_request_id
  ON ai_tasks (request_id);
