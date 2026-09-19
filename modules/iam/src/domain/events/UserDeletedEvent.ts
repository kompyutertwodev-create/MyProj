import { randomUUID } from 'node:crypto';
import type { DomainEvent } from '@workspace/kernel';

/** Emitted when a user is soft-deleted. The row is preserved for audit. */
export class UserDeletedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventName = 'iam.UserDeleted';
  readonly occurredAt: Date;
  readonly aggregateType = 'User';

  constructor(
    readonly aggregateId: string,
    readonly userId: string,
    readonly tenantId: string | null,
    readonly deletedBy: string,
  ) {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
  }
}