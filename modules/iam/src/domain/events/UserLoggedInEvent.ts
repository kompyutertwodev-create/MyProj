import { randomUUID } from 'node:crypto';
import type { DomainEvent } from '@workspace/kernel';

export class UserLoggedInEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventName = 'iam.UserLoggedIn';
  readonly occurredAt: Date;
  readonly aggregateType = 'User';

  constructor(
    readonly aggregateId: string,
    readonly userId: string,
    readonly sessionId: string,
    readonly ipAddress: string
  ) {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
  }
}
