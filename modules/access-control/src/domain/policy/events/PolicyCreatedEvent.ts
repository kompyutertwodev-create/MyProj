import { randomUUID } from 'node:crypto';
import type { DomainEvent } from '@workspace/kernel';

/** Emitted when a new Policy aggregate is created. */
export class PolicyCreatedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventName = 'access-control.policy.created';
  readonly occurredAt: Date;
  readonly aggregateType = 'Policy';

  constructor(
    readonly aggregateId: string,
    readonly tenantId: string | null,
    readonly name: string,
    readonly effect: string,
  ) {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
  }
}