BEGIN;

ALTER TABLE identities
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

ALTER TABLE iam_roles
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

ALTER TABLE iam_permissions
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS identities_deleted_at_idx ON identities(deleted_at);
CREATE INDEX IF NOT EXISTS iam_roles_deleted_at_idx ON iam_roles(deleted_at);
CREATE INDEX IF NOT EXISTS iam_permissions_deleted_at_idx ON iam_permissions(deleted_at);

COMMIT;
