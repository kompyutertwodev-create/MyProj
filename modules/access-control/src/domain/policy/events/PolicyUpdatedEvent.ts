import { randomUUID } from 'node:crypto';
import type { DomainEvent } from '@workspace/kernel';

/** Emitted when any mutable field of a Policy is updated. */
export class PolicyUpdatedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventName = 'access-control.policy.updated';
  readonly occurredAt: Date;
  readonly aggregateType = 'Policy';

  constructor(
    readonly aggregateId: string,
    readonly tenantId: string | null,
    readonly name: string,
  ) {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
  }
}