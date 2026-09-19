import { randomUUID } from 'node:crypto';
import type { DomainEvent } from '@workspace/kernel';

/** Emitted when a Role's description or name metadata is updated. */
export class RoleUpdatedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventName = 'access-control.role.updated';
  readonly occurredAt: Date;
  readonly aggregateType = 'Role';

  constructor(
    readonly aggregateId: string,
    readonly tenantId: string | null,
    readonly name: string,
  ) {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
  }
}