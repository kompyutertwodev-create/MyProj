import type { AuditEventType } from '../AuditEventType.js';
import type { AuditLog } from '../AuditLog.js';

export interface AuditLogFilter {
  actorId?: string;
  tenantId?: string;
  eventType?: AuditEventType;
  targetType?: string;
  targetId?: string;
  from?: Date;
  to?: Date;
}

export interface AuditLogRepository {
  findById(id: string): Promise<AuditLog | null>;
  findAll(filter: AuditLogFilter, options: { limit: number; offset: number }): Promise<AuditLog[]>;
  countAll(filter: AuditLogFilter): Promise<number>;
  save(log: AuditLog): Promise<void>;
  saveMany(logs: AuditLog[]): Promise<void>;
}
