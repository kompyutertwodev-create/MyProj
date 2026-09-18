import type { AuditEventType } from '../../domain/AuditEventType.js';

export interface AuditLogView {
  id: string;
  eventType: AuditEventType;
  actorId: string;
  tenantId: string | null;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  occurredAt: string;
}
