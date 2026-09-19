-- =============================================================================
-- Tenant вЂ” v2 schema
-- =============================================================================
--
-- Enterprise pattern:
--   * UUID primary keys
--   * TIMESTAMPTZ everywhere
--   * Soft delete via deleted_at + partial unique index on slug
--   * version column for optimistic concurrency
--   * Indexes on slug / status / owner
--   * updated_at triggers
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DROP TABLE IF EXISTS tenant_members CASCADE;
DROP TABLE IF EXISTS tenant_tenants CASCADE;

-- в”Ђв”Ђ tenant_tenants в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
CREATE TABLE IF NOT EXISTS tenant_tenants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL,
  status        TEXT NOT NULL,
  settings      JSONB NOT NULL DEFAULT '{}'::jsonb,
  owner_user_id UUID NOT NULL,
  deleted_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version       INTEGER NOT NULL DEFAULT 0
);

-- Only live slugs must be unique so a deleted tenant frees its slug.
CREATE UNIQUE INDEX IF NOT EXISTS tenant_tenants_slug_unique
  ON tenant_tenants (slug) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS tenant_tenants_status_idx
  ON tenant_tenants (status);
CREATE INDEX IF NOT EXISTS tenant_tenants_owner_idx
  ON tenant_tenants (owner_user_id);
CREATE INDEX IF NOT EXISTS tenant_tenants_deleted_at_idx
  ON tenant_tenants (deleted_at) WHERE deleted_at IS NOT NULL;

-- в”Ђв”Ђ tenant_members в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
CREATE TABLE IF NOT EXISTS tenant_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenant_tenants(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL,
  role       TEXT NOT NULL,
  status     TEXT NOT NULL,
  invited_by UUID,
  joined_at  TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version    INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS tenant_members_tenant_user_unique
  ON tenant_members (tenant_id, user_id);
CREATE INDEX IF NOT EXISTS tenant_members_tenant_idx
  ON tenant_members (tenant_id);
CREATE INDEX IF NOT EXISTS tenant_members_user_idx
  ON tenant_members (user_id);

-- в”Ђв”Ђ updated_at triggers в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
CREATE OR REPLACE FUNCTION tenant_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tenant_tenants_touch_updated_at ON tenant_tenants;
CREATE TRIGGER tenant_tenants_touch_updated_at
  BEFORE UPDATE ON tenant_tenants
  FOR EACH ROW EXECUTE FUNCTION tenant_touch_updated_at();

DROP TRIGGER IF EXISTS tenant_members_touch_updated_at ON tenant_members;
CREATE TRIGGER tenant_members_touch_updated_at
  BEFORE UPDATE ON tenant_members
  FOR EACH ROW EXECUTE FUNCTION tenant_touch_updated_at();

COMMIT;