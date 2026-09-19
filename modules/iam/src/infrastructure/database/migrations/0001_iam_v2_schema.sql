-- =============================================================================
-- IAM вЂ” v2 schema rewrite
-- =============================================================================
-- (oldingi qismi o'zgarishsiz qoladi)
-- =============================================================================

BEGIN;

-- в”Ђв”Ђ Extensions в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- в”Ђв”Ђ Drop legacy tables в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
DROP TABLE IF EXISTS iam_outbox_events CASCADE;
DROP TABLE IF EXISTS iam_oauth_states   CASCADE;
DROP TABLE IF EXISTS iam_devices        CASCADE;
DROP TABLE IF EXISTS iam_policies       CASCADE;
DROP TABLE IF EXISTS iam_role_permissions CASCADE;
DROP TABLE IF EXISTS iam_identity_roles CASCADE;
DROP TABLE IF EXISTS iam_permissions    CASCADE;
DROP TABLE IF EXISTS iam_roles          CASCADE;
DROP TABLE IF EXISTS iam_sessions       CASCADE;
DROP TABLE IF EXISTS social_identities  CASCADE;
DROP TABLE IF EXISTS identities         CASCADE;
DROP TYPE IF EXISTS identity_status;

-- в”Ђв”Ђ identities в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
CREATE TABLE IF NOT EXISTS identities (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email            CITEXT NOT NULL,
  password_hash    TEXT NOT NULL,
  password_set     BOOLEAN NOT NULL DEFAULT TRUE,
  display_name     TEXT NOT NULL,
  avatar_url       TEXT,
  status           TEXT NOT NULL DEFAULT 'unverified'
                   CHECK (status IN ('active', 'suspended', 'unverified', 'deleted')),
  mfa_enabled      BOOLEAN NOT NULL DEFAULT FALSE,
  mfa_secret       TEXT,
  mfa_backup_codes TEXT[],
  tenant_id        UUID,
  deleted_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version          INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS identities_email_unique
  ON identities (email) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS identities_tenant_idx ON identities (tenant_id);
CREATE INDEX IF NOT EXISTS identities_status_idx ON identities (status);
CREATE INDEX IF NOT EXISTS identities_deleted_at_idx ON identities (deleted_at)
  WHERE deleted_at IS NOT NULL;

-- в”Ђв”Ђ iam_sessions в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
CREATE TABLE IF NOT EXISTS iam_sessions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id        UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
  device_id          TEXT NOT NULL,
  device_name        TEXT NOT NULL,
  device_type        TEXT NOT NULL,
  ip_address         TEXT NOT NULL,
  user_agent         TEXT NOT NULL,
  refresh_token_hash TEXT NOT NULL,
  expires_at         TIMESTAMPTZ NOT NULL,
  last_active_at     TIMESTAMPTZ NOT NULL,
  revoked_at         TIMESTAMPTZ,
  revoked_reason     TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version            INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS iam_sessions_refresh_token_hash_unique
  ON iam_sessions (refresh_token_hash);
CREATE INDEX IF NOT EXISTS iam_sessions_identity_idx ON iam_sessions (identity_id);
CREATE INDEX IF NOT EXISTS iam_sessions_active_idx
  ON iam_sessions (identity_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS iam_sessions_expires_idx
  ON iam_sessions (expires_at) WHERE revoked_at IS NULL;

-- в”Ђв”Ђ social_identities в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
CREATE TABLE IF NOT EXISTS social_identities (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
  provider              TEXT NOT NULL,
  provider_user_id      TEXT NOT NULL,
  provider_email        CITEXT,
  provider_display_name TEXT NOT NULL,
  access_token          TEXT,
  refresh_token         TEXT,
  token_expires_at      TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS social_identities_provider_user_unique
  ON social_identities (provider, provider_user_id);
CREATE INDEX IF NOT EXISTS social_identities_user_idx ON social_identities (user_id);

-- в”Ђв”Ђ iam_devices в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
CREATE TABLE IF NOT EXISTS iam_devices (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id  UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
  type         TEXT NOT NULL,
  name         TEXT NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS iam_devices_identity_idx ON iam_devices (identity_id);

-- в”Ђв”Ђ iam_oauth_states в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
CREATE TABLE IF NOT EXISTS iam_oauth_states (
  state      TEXT PRIMARY KEY,
  provider   TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS iam_oauth_states_expires_idx
  ON iam_oauth_states (expires_at);

-- в”Ђв”Ђ iam_outbox_events в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
-- Shape matches @workspace/platform's OutboxStore: status / availableAt /
-- lockedAt / lockToken drive the shared dispatcher.
CREATE TABLE IF NOT EXISTS iam_outbox_events (
  id                UUID PRIMARY KEY,
  event_name        TEXT NOT NULL,
  aggregate_type    TEXT NOT NULL,
  aggregate_id      UUID NOT NULL,
  tenant_id         UUID,
  payload           JSONB NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending',
  attempts          INTEGER NOT NULL DEFAULT 0,
  available_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_at         TIMESTAMPTZ,
  lock_token        TEXT,
  published_at      TIMESTAMPTZ,
  last_error        TEXT,
  correlation_id    UUID,
  causation_id      UUID,
  actor_id          UUID,
  schema_version    INTEGER NOT NULL DEFAULT 1,
  metadata          JSONB NOT NULL DEFAULT '{}'::jsonb,
  aggregate_version INTEGER NOT NULL DEFAULT 0,
  occurred_at       TIMESTAMPTZ NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS iam_outbox_events_pending_idx
  ON iam_outbox_events (status, available_at, created_at);

CREATE INDEX IF NOT EXISTS iam_outbox_events_lock_idx
  ON iam_outbox_events (status, locked_at);

CREATE INDEX IF NOT EXISTS iam_outbox_events_aggregate_idx
  ON iam_outbox_events (aggregate_type, aggregate_id);

-- в”Ђв”Ђ updated_at triggers в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
CREATE OR REPLACE FUNCTION iam_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS identities_touch_updated_at ON identities;
CREATE TRIGGER identities_touch_updated_at
  BEFORE UPDATE ON identities
  FOR EACH ROW EXECUTE FUNCTION iam_touch_updated_at();

DROP TRIGGER IF EXISTS iam_sessions_touch_updated_at ON iam_sessions;
CREATE TRIGGER iam_sessions_touch_updated_at
  BEFORE UPDATE ON iam_sessions
  FOR EACH ROW EXECUTE FUNCTION iam_touch_updated_at();

DROP TRIGGER IF EXISTS social_identities_touch_updated_at ON social_identities;
CREATE TRIGGER social_identities_touch_updated_at
  BEFORE UPDATE ON social_identities
  FOR EACH ROW EXECUTE FUNCTION iam_touch_updated_at();

DROP TRIGGER IF EXISTS iam_devices_touch_updated_at ON iam_devices;
CREATE TRIGGER iam_devices_touch_updated_at
  BEFORE UPDATE ON iam_devices
  FOR EACH ROW EXECUTE FUNCTION iam_touch_updated_at();

COMMIT;