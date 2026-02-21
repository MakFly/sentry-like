CREATE TABLE IF NOT EXISTS application_logs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL,
  level TEXT NOT NULL,
  channel TEXT NOT NULL,
  message TEXT NOT NULL,
  context JSONB,
  extra JSONB,
  env TEXT,
  release TEXT,
  source TEXT NOT NULL DEFAULT 'app',
  url TEXT,
  request_id TEXT,
  user_id TEXT,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_application_logs_project_created
  ON application_logs(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_application_logs_project_level_created
  ON application_logs(project_id, level, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_application_logs_project_channel_created
  ON application_logs(project_id, channel, created_at DESC);
