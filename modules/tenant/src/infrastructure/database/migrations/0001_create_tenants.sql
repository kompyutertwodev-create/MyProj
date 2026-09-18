BEGIN;

CREATE TABLE IF NOT EXISTS tenant_tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  owner_user_id TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_members (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenant_tenants(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL,
  invited_by TEXT,
  joined_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT tenant_members_tenant_user_unique UNIQUE (tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS tenant_tenants_slug_idx ON tenant_tenants(slug);
CREATE INDEX IF NOT EXISTS tenant_tenants_status_idx ON tenant_tenants(status);
CREATE INDEX IF NOT EXISTS tenant_tenants_owner_idx ON tenant_tenants(owner_user_id);
CREATE INDEX IF NOT EXISTS tenant_members_tenant_idx ON tenant_members(tenant_id);
CREATE INDEX IF NOT EXISTS tenant_members_user_idx ON tenant_members(user_id);

COMMIT;
