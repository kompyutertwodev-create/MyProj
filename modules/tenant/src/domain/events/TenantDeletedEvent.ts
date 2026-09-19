import { randomUUID } from 'node:crypto';
import type { DomainEvent } from '@workspace/kernel';

/** Emitted when a tenant is soft-deleted. The row is preserved for audit. */
export class TenantDeletedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventName = 'tenant.deleted';
  readonly occurredAt: Date;
  readonly aggregateType = 'Tenant';

  constructor(
    readonly aggregateId: string,
    readonly tenantId: string,
    readonly ownerUserId: string,
    readonly deletedBy: string,
  ) {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
  }
}