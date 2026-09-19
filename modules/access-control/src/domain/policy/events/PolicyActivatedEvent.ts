import { randomUUID } from 'node:crypto';
import type { DomainEvent } from '@workspace/kernel';

/** Emitted when a Policy is activated (starts being evaluated). */
export class PolicyActivatedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventName = 'access-control.policy.activated';
  readonly occurredAt: Date;
  readonly aggregateType = 'Policy';

  constructor(
    readonly aggregateId: string,
    readonly tenantId: string | null,
  ) {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
  }
}