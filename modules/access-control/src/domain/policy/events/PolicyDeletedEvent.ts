import { randomUUID } from 'node:crypto';
import type { DomainEvent } from '@workspace/kernel';

/**
 * Emitted when a Policy is deleted (soft delete).
 *
 * The actor is captured so downstream modules (audit, notification) can
 * record *who* removed the policy, not just that it disappeared.
 */
export class PolicyDeletedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventName = 'access-control.policy.deleted';
  readonly occurredAt: Date;
  readonly aggregateType = 'Policy';

  constructor(
    readonly aggregateId: string,
    readonly tenantId: string | null,
    readonly name: string,
    readonly deletedBy: string,
  ) {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
  }
}