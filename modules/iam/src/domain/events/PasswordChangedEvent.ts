import { randomUUID } from 'node:crypto';
import type { DomainEvent } from '@workspace/kernel';

export class PasswordChangedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventName = 'iam.PasswordChanged';
  readonly occurredAt: Date;
  readonly aggregateType = 'User';

  constructor(
    readonly aggregateId: string,
    readonly userId: string
  ) {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
  }
}
