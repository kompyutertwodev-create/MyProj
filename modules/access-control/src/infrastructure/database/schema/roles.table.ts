import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * Access-control roles.
 *
 * Table name is prefixed `ac_` to keep the module self-contained during
 * the transition away from the legacy iam RBAC tables. Permissions live in
 * a separate join table (`ac_role_permissions`) so role definitions stay
 * normalized and permission lookups are O(1) per role.
 *
 * `tenantId` is nullable: null means a platform/system role visible across
 * tenants; a non-null value scopes the role to that tenant.
 *
 * The (tenantId, name) unique index uses `sql` because Drizzle does not
 * yet model COALESCE-based unique indexes. See the migration for the
 * authoritative version вЂ” this declaration only keeps Drizzle Kit in sync.
 */
export const acRoles = pgTable(
  'ac_roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description').notNull().default(''),
    isSystem: boolean('is_system').notNull().default(false),
    tenantId: uuid('tenant_id'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    version: integer('version').notNull().default(0),
  },
  (table) => ({
    nameIdx: index('ac_roles_name_idx').on(table.name),
    tenantIdx: index('ac_roles_tenant_idx').on(table.tenantId),
    systemIdx: index('ac_roles_system_idx').on(table.isSystem),
  }),
);

export type AcRoleRow = typeof acRoles.$inferSelect;
export type AcRoleInsert = typeof acRoles.$inferInsert;