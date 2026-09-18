import { randomUUID } from 'node:crypto';
import type { DomainEvent } from '@workspace/kernel';

export class UserRegisteredEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventName = 'iam.UserRegistered';
  readonly occurredAt: Date;
  readonly aggregateType = 'User';

  constructor(
    readonly aggregateId: string,
    readonly userId: string,
    readonly email: string,
    readonly displayName: string
  ) {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
  }
}
