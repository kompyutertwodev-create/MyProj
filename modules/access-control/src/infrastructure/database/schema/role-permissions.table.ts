import {
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { acRoles } from './roles.table.js';

/**
 * Permissions granted to a role.
 *
 * Keyed by (roleId, permissionName) because permissions are value objects
 * in the domain вЂ” there is no global identity, only the `resource:action`
 * name. The composite primary key is enforced here and in the migration.
 */
export const acRolePermissions = pgTable(
  'ac_role_permissions',
  {
    roleId: uuid('role_id')
      .notNull()
      .references(() => acRoles.id, { onDelete: 'cascade' }),
    permissionName: text('permission_name').notNull(),
    description: text('description').notNull().default(''),
    grantedAt: timestamp('granted_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.roleId, table.permissionName] }),
    permissionIdx: index('ac_role_permissions_name_idx').on(
      table.permissionName,
    ),
  }),
);

export type AcRolePermissionRow = typeof acRolePermissions.$inferSelect;
export type AcRolePermissionInsert = typeof acRolePermissions.$inferInsert;