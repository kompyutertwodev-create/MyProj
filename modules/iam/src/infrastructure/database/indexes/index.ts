import { index } from 'drizzle-orm/pg-core';
import { identities } from '../schema/identities.table.js';
import { sessions } from '../schema/sessions.table.js';

/** Secondary indexes kept next to the schema to make query intent explicit. */
export const identityEmailIndex = index('iam_identity_email_idx').on(identities.email);
export const sessionRefreshTokenIndex = index('iam_session_refresh_token_idx').on(
  sessions.refreshToken
);
export const sessionIdentityIndex = index('iam_session_identity_idx').on(sessions.identityId);
