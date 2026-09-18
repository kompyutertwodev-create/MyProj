import type { DomainEvent } from '@workspace/kernel';
import { randomUUID } from 'node:crypto';

export class TenantCreatedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventName = 'tenant.created';
  readonly occurredAt: Date;
  readonly aggregateType = 'Tenant';

  constructor(
    readonly aggregateId: string,
    readonly tenantId: string,
    readonly name: string,
    readonly slug: string
  ) {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
  }
}
