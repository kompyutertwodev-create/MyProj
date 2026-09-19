-- =============================================================================
-- Access Control вЂ” outbox metadata columns
-- =============================================================================
--
-- Adds the correlation / causation / actor / tenant / schema metadata that
-- the application layer now attaches to every outbox row. All columns are
-- nullable or have a safe default, so the migration is forward-compatible
-- with existing rows (which will simply have NULL metadata).
--
-- The correlation_id index is the hot path for tracing: "show me every
-- event produced while handling request X".
-- =============================================================================

BEGIN;

ALTER TABLE ac_outbox_events
  ADD COLUMN IF NOT EXISTS correlation_id UUID,
  ADD COLUMN IF NOT EXISTS causation_id   UUID,
  ADD COLUMN IF NOT EXISTS actor_id       UUID,
  ADD COLUMN IF NOT EXISTS schema_version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS metadata       JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS aggregate_version INTEGER NOT NULL DEFAULT 0;

-- Partial index for the dispatcher's hot path (only unpublished rows).
DROP INDEX IF EXISTS ac_outbox_events_unpublished_idx;
CREATE INDEX IF NOT EXISTS ac_outbox_events_unpublished_idx
  ON ac_outbox_events (created_at)
  WHERE published_at IS NULL;

CREATE INDEX IF NOT EXISTS ac_outbox_events_correlation_idx
  ON ac_outbox_events (correlation_id)
  WHERE correlation_id IS NOT NULL;

COMMIT;