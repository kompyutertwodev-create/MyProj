-- =============================================================================
-- Tenant вЂ” outbox events
-- =============================================================================
--
-- Shape matches @workspace/platform's OutboxStore (status / availableAt /
-- lockedAt / lockToken) so the shared dispatcher can claim and publish.
-- Metadata columns mirror kernel.EventMetadata.
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS tenant_outbox_events (
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

CREATE INDEX IF NOT EXISTS tenant_outbox_events_pending_idx
  ON tenant_outbox_events (status, available_at, created_at);
CREATE INDEX IF NOT EXISTS tenant_outbox_events_lock_idx
  ON tenant_outbox_events (status, locked_at);
CREATE INDEX IF NOT EXISTS tenant_outbox_events_aggregate_idx
  ON tenant_outbox_events (aggregate_type, aggregate_id);

COMMIT;