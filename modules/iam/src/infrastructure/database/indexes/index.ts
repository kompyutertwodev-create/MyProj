import { index } from 'drizzle-orm/pg-core';
import { identities } from '../schema/identities.table.js';
import { sessions } from '../schema/sessions.table.js';

/**
 * Secondary indexes kept next to the schema so query intent is explicit.
 *
 * The actual CREATE INDEX statements live in the migration so the schema
 * stays declarative; these exports exist purely for documentation and for
 * `drizzle-kit` introspection.
 */
export const identityEmailIndex = index('iam_identity_email_idx').on(
  identities.email,
);

export const sessionRefreshTokenHashIndex = index(
  'iam_session_refresh_token_hash_idx',
).on(sessions.refreshTokenHash);

export const sessionIdentityIndex = index('iam_session_identity_idx').on(
  sessions.identityId,
);