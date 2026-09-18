BEGIN;

CREATE TABLE IF NOT EXISTS iam_outbox_events (
  id TEXT PRIMARY KEY,
  event_name TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  aggregate_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  available_at TIMESTAMP NOT NULL,
  locked_at TIMESTAMP,
  lock_token TEXT,
  published_at TIMESTAMP,
  last_error TEXT,
  occurred_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS iam_outbox_pending_idx
  ON iam_outbox_events(status, available_at, created_at);

CREATE INDEX IF NOT EXISTS iam_outbox_lock_idx
  ON iam_outbox_events(status, locked_at);

COMMIT;