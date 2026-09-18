import type { DomainEvent } from '@workspace/kernel';
import { randomUUID } from 'node:crypto';

export class TenantUpdatedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventName = 'tenant.updated';
  readonly occurredAt: Date;
  readonly aggregateType = 'Tenant';

  constructor(
    readonly aggregateId: string,
    readonly tenantId: string
  ) {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
  }
}
