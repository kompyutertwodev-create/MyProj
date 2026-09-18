import type { DomainEvent } from '@workspace/kernel';
import { randomUUID } from 'node:crypto';

export class TenantSuspendedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventName = 'tenant.suspended';
  readonly occurredAt: Date;
  readonly aggregateType = 'Tenant';

  constructor(
    readonly aggregateId: string,
    readonly tenantId: string,
    readonly reason: string
  ) {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
  }
}
