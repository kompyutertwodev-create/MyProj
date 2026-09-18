import { randomUUID } from 'node:crypto';
import type { DomainEvent } from '@workspace/kernel';

export class UserLoggedOutEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventName = 'iam.UserLoggedOut';
  readonly occurredAt: Date;
  readonly aggregateType = 'User';

  constructor(
    readonly aggregateId: string,
    readonly userId: string,
    readonly sessionId: string
  ) {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
  }
}
