import { pgTable, text, primaryKey } from 'drizzle-orm/pg-core';
import { identities } from './identities.table.js';
import { roles } from './roles.table.js';

export const identityRoles = pgTable(
  'iam_identity_roles',
  {
    identityId: text('identity_id')
      .notNull()
      .references(() => identities.id, { onDelete: 'cascade' }),
    roleId: text('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
  },
  (t) => ({ pk: primaryKey({ columns: [t.identityId, t.roleId] }) })
);
