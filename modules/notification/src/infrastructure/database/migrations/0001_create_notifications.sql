BEGIN;

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  recipient_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  contact_value TEXT NOT NULL,
  status TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  template_key TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  sent_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_recipient_idx ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS notifications_channel_idx ON notifications(channel);
CREATE INDEX IF NOT EXISTS notifications_status_idx ON notifications(status);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at);

COMMIT;
