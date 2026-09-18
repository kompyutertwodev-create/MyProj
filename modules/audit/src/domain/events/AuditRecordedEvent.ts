import { randomUUID } from 'node:crypto';
import type { DomainEvent } from '@workspace/kernel';
import type { AuditEventType } from '../AuditEventType.js';

/**
 * Raised when a new audit log entry is recorded.
 * Consumers can subscribe to build analytics, alerts, etc.
 */
export class AuditRecordedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventName = 'audit.recorded';
  readonly occurredAt: Date;
  readonly aggregateType = 'AuditLog';

  constructor(
    readonly aggregateId: string,
    readonly auditLogId: string,
    readonly originalEventType: AuditEventType,
    readonly actorId: string,
    readonly tenantId: string | null
  ) {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
  }
}
