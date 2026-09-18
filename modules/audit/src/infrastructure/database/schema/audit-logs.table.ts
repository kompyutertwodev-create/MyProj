import { index, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: text('id').primaryKey(),
    eventType: text('event_type').notNull(),
    actorId: text('actor_id').notNull(),
    tenantId: text('tenant_id'),
    targetType: text('target_type').notNull(),
    targetId: text('target_id').notNull(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    occurredAt: timestamp('occurred_at').notNull().defaultNow(),
  },
  (table) => ({
    actorIdx: index('audit_logs_actor_idx').on(table.actorId),
    tenantIdx: index('audit_logs_tenant_idx').on(table.tenantId),
    eventTypeIdx: index('audit_logs_event_type_idx').on(table.eventType),
    targetIdx: index('audit_logs_target_idx').on(table.targetType, table.targetId),
    occurredAtIdx: index('audit_logs_occurred_at_idx').on(table.occurredAt),
  })
);

export type AuditLogRow = typeof auditLogs.$inferSelect;
export type AuditLogInsertRow = typeof auditLogs.$inferInsert;
