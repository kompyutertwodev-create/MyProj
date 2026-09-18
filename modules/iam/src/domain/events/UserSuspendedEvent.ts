import { randomUUID } from 'node:crypto';
import type { DomainEvent } from '@workspace/kernel';

export class UserSuspendedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventName = 'iam.UserSuspended';
  readonly occurredAt: Date;
  readonly aggregateType = 'User';

  constructor(
    readonly aggregateId: string,
    readonly userId: string,
    readonly reason: string
  ) {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
  }
}
