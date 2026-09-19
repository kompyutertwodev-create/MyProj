import { randomUUID } from 'node:crypto';
import type { DomainEvent } from '@workspace/kernel';

/** Emitted when a Policy is deactivated (no longer evaluated). */
export class PolicyDeactivatedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventName = 'access-control.policy.deactivated';
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