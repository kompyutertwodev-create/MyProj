import { AuditLog } from '../../domain/AuditLog.js';
import type { AuditEventType } from '../../domain/AuditEventType.js';

export interface AuditLogPersistence {
  id: string;
  eventType: AuditEventType;
  actorId: string;
  tenantId: string | null;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  occurredAt: Date;
}

export class AuditLogMapper {
  static toDomain(row: AuditLogPersistence): AuditLog {
    return AuditLog.reconstruct({
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
    });
  }

  static toPersistence(log: AuditLog): AuditLogPersistence {
    return {
      id: log.id.value,
      eventType: log.eventType,
      actorId: log.actorId.value,
      tenantId: log.tenantRef.value,
      targetType: log.targetType,
      targetId: log.targetId,
      metadata: log.metadata,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      occurredAt: log.occurredAt,
    };
  }
}
