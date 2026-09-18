import type { AuditEventType } from '../../../domain/AuditEventType.js';

export interface ListAuditLogsQuery {
  page: number;
  pageSize: number;
  actorId?: string;
  tenantId?: string;
  eventType?: AuditEventType;
  targetType?: string;
  targetId?: string;
  from?: Date;
  to?: Date;
}
