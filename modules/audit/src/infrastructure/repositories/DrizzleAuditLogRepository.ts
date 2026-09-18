import { and, desc, eq, gte, lte, sql, type SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { AuditEventType } from '../../domain/AuditEventType.js';
import type { AuditLog } from '../../domain/AuditLog.js';
import type {
  AuditLogFilter,
  AuditLogRepository,
} from '../../domain/repositories/AuditLogRepository.js';
import { AuditLogMapper } from '../mappers/AuditLogMapper.js';
import { auditLogs } from '../database/schema/audit-logs.table.js';

export class DrizzleAuditLogRepository implements AuditLogRepository {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly db: NodePgDatabase<any>) {}

  async findById(id: string): Promise<AuditLog | null> {
    const rows = await this.db.select().from(auditLogs).where(eq(auditLogs.id, id)).limit(1);
    const row = rows[0];
    if (!row) return null;
    return this.toDomain(row);
  }

  async findAll(
    filter: AuditLogFilter,
    options: { limit: number; offset: number }
  ): Promise<AuditLog[]> {
    const where = this.buildWhere(filter);
    const rows = await this.db
      .select()
      .from(auditLogs)
      .where(where)
      .orderBy(desc(auditLogs.occurredAt))
      .limit(options.limit)
      .offset(options.offset);

    return rows.map((row) => this.toDomain(row));
  }

  async countAll(filter: AuditLogFilter): Promise<number> {
    const where = this.buildWhere(filter);
    const rows = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(auditLogs)
      .where(where);
    return rows[0]?.count ?? 0;
  }

  async save(log: AuditLog): Promise<void> {
    const row = AuditLogMapper.toPersistence(log);
    await this.db
      .insert(auditLogs)
      .values({
        id: row.id,
        eventType: row.eventType,
        actorId: row.actorId,
        tenantId: row.tenantId,
        targetType: row.targetType,
        targetId: row.targetId,
        metadata: row.metadata,
        ipAddress: row.ipAddress,
        userAgent: row.userAgent,
        occurredAt: row.occurredAt,
      })
      .onConflictDoNothing();
  }

  async saveMany(logs: AuditLog[]): Promise<void> {
    if (logs.length === 0) return;
    const rows = logs.map((log) => {
      const row = AuditLogMapper.toPersistence(log);
      return {
        id: row.id,
        eventType: row.eventType,
        actorId: row.actorId,
        tenantId: row.tenantId,
        targetType: row.targetType,
        targetId: row.targetId,
        metadata: row.metadata,
        ipAddress: row.ipAddress,
        userAgent: row.userAgent,
        occurredAt: row.occurredAt,
      };
    });
    await this.db.insert(auditLogs).values(rows).onConflictDoNothing();
  }

  private buildWhere(filter: AuditLogFilter): SQL<unknown> | undefined {
    const conditions: SQL<unknown>[] = [];
    if (filter.actorId) conditions.push(eq(auditLogs.actorId, filter.actorId));
    if (filter.tenantId) conditions.push(eq(auditLogs.tenantId, filter.tenantId));
    if (filter.eventType) conditions.push(eq(auditLogs.eventType, filter.eventType));
    if (filter.targetType) conditions.push(eq(auditLogs.targetType, filter.targetType));
    if (filter.targetId) conditions.push(eq(auditLogs.targetId, filter.targetId));
    if (filter.from) conditions.push(gte(auditLogs.occurredAt, filter.from));
    if (filter.to) conditions.push(lte(auditLogs.occurredAt, filter.to));

    if (conditions.length === 0) return undefined;
    if (conditions.length === 1) return conditions[0];
    return and(...conditions);
  }

  private toDomain(row: typeof auditLogs.$inferSelect): AuditLog {
    return AuditLogMapper.toDomain({
      id: row.id,
      eventType: row.eventType as AuditEventType,
      actorId: row.actorId,
      tenantId: row.tenantId,
      targetType: row.targetType,
      targetId: row.targetId,
      metadata: row.metadata,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      occurredAt: row.occurredAt,
    });
  }
}
