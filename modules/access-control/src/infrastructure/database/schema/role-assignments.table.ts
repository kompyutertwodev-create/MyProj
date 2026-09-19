import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { acRoles } from './roles.table.js';

/**
 * Role assignments (user в†” role grants).
 *
 * One row per grant, with full audit metadata. A user holds a role for as
 * long as `revokedAt IS NULL` and (if set) `expiresAt` has not passed.
 *
 * History is preserved when a user is re-granted a role: the previous row
 * keeps its `revokedAt` value and a new row is inserted. The partial unique
 * index that enforces "one active grant per (user, role)" lives in the
 * migration вЂ” Drizzle Kit does not yet support partial indexes portably.
 *
 * `userId`, `assignedBy` and `revokedBy` are stored as raw UUID values (no
 * FK into the iam schema) so `access-control` stays independent of the
 * identity module.
 */
export const acRoleAssignments = pgTable(
  'ac_role_assignments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    roleId: uuid('role_id')
      .notNull()
      .references(() => acRoles.id, { onDelete: 'restrict' }),
    roleName: text('role_name').notNull(),
    tenantId: uuid('tenant_id'),
    assignedBy: uuid('assigned_by').notNull(),
    assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    revokedBy: uuid('revoked_by'),
    revokedReason: text('revoked_reason'),
    isExpired: boolean('is_expired').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    version: integer('version').notNull().default(0),
  },
  (table) => ({
    userIdx: index('ac_role_assignments_user_idx').on(table.userId),
    roleIdx: index('ac_role_assignments_role_idx').on(table.roleId),
    tenantIdx: index('ac_role_assignments_tenant_idx').on(table.tenantId),
  }),
);

export type AcRoleAssignmentRow = typeof acRoleAssignments.$inferSelect;
export type AcRoleAssignmentInsert = typeof acRoleAssignments.$inferInsert;