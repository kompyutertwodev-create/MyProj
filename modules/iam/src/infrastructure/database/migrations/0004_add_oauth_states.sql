BEGIN;

CREATE TABLE IF NOT EXISTS iam_oauth_states (
  state TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS iam_oauth_states_expires_at_idx
  ON iam_oauth_states(expires_at);

COMMIT;