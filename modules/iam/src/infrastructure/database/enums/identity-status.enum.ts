import { pgEnum } from 'drizzle-orm/pg-core';

export const identityStatus = pgEnum('identity_status', [
  'active',
  'suspended',
  'unverified',
  'deleted',
]);
