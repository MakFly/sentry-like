CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_error_groups_message_trgm
  ON error_groups USING gin (message gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_error_groups_file_trgm
  ON error_groups USING gin (file gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_application_logs_message_trgm
  ON application_logs USING gin (message gin_trgm_ops);
