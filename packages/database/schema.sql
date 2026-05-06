CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS app_users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  email_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
  university TEXT NOT NULL DEFAULT '',
  major TEXT NOT NULL DEFAULT '',
  grade TEXT NOT NULL DEFAULT '',
  target_industries TEXT[] NOT NULL DEFAULT '{}',
  target_cities TEXT[] NOT NULL DEFAULT '{}',
  skills TEXT[] NOT NULL DEFAULT '{}',
  preferred_job_types TEXT[] NOT NULL DEFAULT '{}',
  considers_postgraduate BOOLEAN NOT NULL DEFAULT FALSE,
  considers_civil_service BOOLEAN NOT NULL DEFAULT FALSE,
  resume_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  industry TEXT NOT NULL,
  city TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  company_name TEXT NOT NULL,
  company_industry TEXT NOT NULL,
  title TEXT NOT NULL,
  work_location TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  required_skills TEXT[] NOT NULL DEFAULT '{}',
  description TEXT NOT NULL DEFAULT '',
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  deadline TIMESTAMPTZ,
  popularity INTEGER NOT NULL DEFAULT 0,
  raw_requirements JSONB,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_cases (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  career_path TEXT NOT NULL,
  background_major TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  summary TEXT NOT NULL DEFAULT '',
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS career_events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_industry TEXT NOT NULL,
  city TEXT NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  registration_deadline TIMESTAMPTZ,
  description TEXT NOT NULL DEFAULT '',
  is_featured BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS daily_content (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('advice', 'company', 'job')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  target_industries TEXT[] NOT NULL DEFAULT '{}',
  target_cities TEXT[] NOT NULL DEFAULT '{}',
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  active_from TIMESTAMPTZ,
  active_to TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS postgraduate_advice (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  action_items TEXT[] NOT NULL DEFAULT '{}',
  target_majors TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS civil_service_advice (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  action_items TEXT[] NOT NULL DEFAULT '{}',
  target_cities TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schedule_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('job', 'event', 'exam', 'user')),
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  city TEXT,
  description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS ai_run_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  capability TEXT NOT NULL,
  pipeline TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'failed')),
  request_id TEXT,
  user_id TEXT,
  input_json JSONB,
  output_json JSONB,
  error_json JSONB,
  token_usage_json JSONB,
  latency_ms INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE INDEX IF NOT EXISTS idx_ai_run_logs_capability_created_at
  ON ai_run_logs (capability, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_run_logs_request_id
  ON ai_run_logs (request_id);

CREATE INDEX IF NOT EXISTS idx_ai_run_logs_user_id_created_at
  ON ai_run_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_tasks_user_id_created_at
  ON ai_tasks (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_tasks_status_created_at
  ON ai_tasks (status, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_ai_tasks_capability_status_created_at
  ON ai_tasks (capability, status, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_ai_tasks_request_id
  ON ai_tasks (request_id);
