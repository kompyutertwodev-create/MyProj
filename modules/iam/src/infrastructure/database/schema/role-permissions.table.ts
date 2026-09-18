import { pgTable, text, primaryKey } from 'drizzle-orm/pg-core';
import { roles } from './roles.table.js';
import { permissions } from './permissions.table.js';

export const rolePermissions = pgTable(
  'iam_role_permissions',
  {
    roleId: text('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: text('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
  },
  (t) => ({ pk: primaryKey({ columns: [t.roleId, t.permissionId] }) })
);
