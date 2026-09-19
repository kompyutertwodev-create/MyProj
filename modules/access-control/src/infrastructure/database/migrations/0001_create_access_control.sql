-- =============================================================================
-- Access Control вЂ” RBAC + ABAC schema
-- =============================================================================
--
-- Design principles:
--   * UUID primary keys (native, 16 bytes, validated by the server)
--   * TIMESTAMPTZ everywhere (timezone-safe audit trails)
--   * Partial unique indexes so soft-deleted / revoked rows do not block
--     re-creation of the same logical entity
--   * `version` column for optimistic concurrency control
--   * `tenant_id` nullable for multi-tenancy (NULL = platform-scoped)
--   * FK cascades chosen deliberately (role_permissions cascades; assignments
--     restrict so we cannot silently lose grants)
--   * Every index is prefixed `ac_` so it does not collide with other modules
--
-- Idempotent: safe to re-run, uses IF NOT EXISTS / OR REPLACE throughout.
-- =============================================================================

BEGIN;

-- в”Ђв”Ђ Ensure uuid generation is available в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ac_roles вЂ” the role catalog
-- =============================================================================
CREATE TABLE IF NOT EXISTS ac_roles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  is_system    BOOLEAN NOT NULL DEFAULT FALSE,
  tenant_id    UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version      INTEGER NOT NULL DEFAULT 0
);

-- (tenant_id, name) must be unique among *live* roles. COALESCE lets the
-- same name exist once globally and once per tenant. The tuple is used
-- instead of a partial index because both columns may be NULL and
-- PostgreSQL treats NULLs as distinct in unique indexes.
CREATE UNIQUE INDEX IF NOT EXISTS ac_roles_tenant_name_unique
  ON ac_roles (COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid), name);

CREATE INDEX IF NOT EXISTS ac_roles_name_idx   ON ac_roles (name);
CREATE INDEX IF NOT EXISTS ac_roles_tenant_idx ON ac_roles (tenant_id);
CREATE INDEX IF NOT EXISTS ac_roles_system_idx ON ac_roles (is_system) WHERE is_system = TRUE;

-- =============================================================================
-- ac_role_permissions вЂ” permission grants attached to a role
-- =============================================================================
--
-- Permissions are value objects in the domain, so we key on (role_id,
-- permission_name) rather than a separate permissions table. Cascade
-- delete keeps the join table clean when a role is removed.
CREATE TABLE IF NOT EXISTS ac_role_permissions (
  role_id          UUID NOT NULL REFERENCES ac_roles(id) ON DELETE CASCADE,
  permission_name  TEXT NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  granted_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_name)
);

CREATE INDEX IF NOT EXISTS ac_role_permissions_name_idx
  ON ac_role_permissions (permission_name);

-- =============================================================================
-- ac_role_assignments вЂ” grants of a role to a subject (usually a user)
-- =============================================================================
--
-- Audit trail is first-class: assignedBy / assignedAt, plus optional
-- expiresAt for time-boxed grants, and revokedAt / revokedBy / revokedReason
-- for revocations. Rows are *never* physically deleted вЂ” the partial unique
-- index lets a subject be re-granted a role after revocation.
CREATE TABLE IF NOT EXISTS ac_role_assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL,
  role_id         UUID NOT NULL REFERENCES ac_roles(id) ON DELETE RESTRICT,
  role_name       TEXT NOT NULL,
  tenant_id       UUID,
  assigned_by     UUID NOT NULL,
  assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ,
  revoked_at      TIMESTAMPTZ,
  revoked_by      UUID,
  revoked_reason  TEXT,
  is_expired      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version         INTEGER NOT NULL DEFAULT 0
);

-- Hot path: "does user X have an active role?" вЂ” covered by this index.
CREATE INDEX IF NOT EXISTS ac_role_assignments_user_active_idx
  ON ac_role_assignments (user_id)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS ac_role_assignments_role_idx   ON ac_role_assignments (role_id);
CREATE INDEX IF NOT EXISTS ac_role_assignments_tenant_idx ON ac_role_assignments (tenant_id);
CREATE INDEX IF NOT EXISTS ac_role_assignments_expires_idx
  ON ac_role_assignments (expires_at)
  WHERE expires_at IS NOT NULL AND revoked_at IS NULL;

-- Only *one active* grant per (user, role) вЂ” revoked rows keep their
-- revoked_at value and a new row is inserted for the next grant.
CREATE UNIQUE INDEX IF NOT EXISTS ac_role_assignments_unique_active
  ON ac_role_assignments (user_id, role_id)
  WHERE revoked_at IS NULL;

-- =============================================================================
-- ac_policies вЂ” ABAC policies
-- =============================================================================
--
-- List-shaped fields are JSONB: the evaluator never queries them
-- individually, it loads candidates and filters in memory, so normalizing
-- would add joins without buying anything.
--
-- Soft delete: `is_deleted` is a permanent marker; `is_active` is the
-- runtime switch the evaluator consults.
CREATE TABLE IF NOT EXISTS ac_policies (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  effect       TEXT NOT NULL CHECK (effect IN ('allow', 'deny')),
  subjects     JSONB NOT NULL,
  resources    JSONB NOT NULL,
  actions      JSONB NOT NULL,
  conditions   JSONB NOT NULL DEFAULT '[]'::jsonb,
  priority     INTEGER NOT NULL DEFAULT 100 CHECK (priority >= 0 AND priority <= 10000),
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted   BOOLEAN NOT NULL DEFAULT FALSE,
  tenant_id    UUID,
  created_by   UUID NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version      INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS ac_policies_name_idx   ON ac_policies (name);
CREATE INDEX IF NOT EXISTS ac_policies_tenant_idx ON ac_policies (tenant_id);
CREATE INDEX IF NOT EXISTS ac_policies_active_idx
  ON ac_policies (is_active)
  WHERE is_deleted = FALSE AND is_active = TRUE;

-- Name is unique among non-deleted policies per tenant scope.
CREATE UNIQUE INDEX IF NOT EXISTS ac_policies_tenant_name_unique
  ON ac_policies (COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid), name)
  WHERE is_deleted = FALSE;

-- GIN index for the JSONB overlap operator (?) used by findForSubjects.
-- This is what turns the ABAC evaluation from an O(N) scan into an index
-- hit when the number of policies grows.
CREATE INDEX IF NOT EXISTS ac_policies_subjects_gin_idx
  ON ac_policies USING GIN (subjects);

-- =============================================================================
-- ac_outbox_events вЂ” transactional outbox
-- =============================================================================
--
-- Writes happen inside the same transaction as the aggregate save; a
-- dispatcher owned by the platform drains rows where published_at IS NULL.
-- The partial index keeps the dispatcher's claim query fast even when the
-- table grows to millions of delivered rows.
CREATE TABLE IF NOT EXISTS ac_outbox_events (
  id             UUID PRIMARY KEY,
  event_name     TEXT NOT NULL,
  aggregate_type TEXT NOT NULL,
  aggregate_id   UUID NOT NULL,
  tenant_id      UUID,
  payload        JSONB NOT NULL,
  occurred_at    TIMESTAMPTZ NOT NULL,
  published_at   TIMESTAMPTZ,
  attempts       INTEGER NOT NULL DEFAULT 0,
  last_error     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ac_outbox_events_unpublished_idx
  ON ac_outbox_events (created_at)
  WHERE published_at IS NULL;

CREATE INDEX IF NOT EXISTS ac_outbox_events_aggregate_idx
  ON ac_outbox_events (aggregate_type, aggregate_id);

CREATE INDEX IF NOT EXISTS ac_outbox_events_name_idx
  ON ac_outbox_events (event_name);

-- =============================================================================
-- updated_at triggers вЂ” keep timestamps honest at the DB level
-- =============================================================================
--
-- Relying on application code to update `updated_at` is fragile: a manual
-- UPDATE or a migration script would silently leave a stale value. The
-- trigger below guarantees correctness for every row, every write.
CREATE OR REPLACE FUNCTION ac_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ac_roles_touch_updated_at ON ac_roles;
CREATE TRIGGER ac_roles_touch_updated_at
  BEFORE UPDATE ON ac_roles
  FOR EACH ROW EXECUTE FUNCTION ac_touch_updated_at();

DROP TRIGGER IF EXISTS ac_role_assignments_touch_updated_at ON ac_role_assignments;
CREATE TRIGGER ac_role_assignments_touch_updated_at
  BEFORE UPDATE ON ac_role_assignments
  FOR EACH ROW EXECUTE FUNCTION ac_touch_updated_at();

DROP TRIGGER IF EXISTS ac_policies_touch_updated_at ON ac_policies;
CREATE TRIGGER ac_policies_touch_updated_at
  BEFORE UPDATE ON ac_policies
  FOR EACH ROW EXECUTE FUNCTION ac_touch_updated_at();

COMMIT;