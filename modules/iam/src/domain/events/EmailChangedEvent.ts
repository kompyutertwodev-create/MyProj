import { randomUUID } from 'node:crypto';
import type { DomainEvent } from '@workspace/kernel';

export class EmailChangedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventName = 'iam.EmailChanged';
  readonly occurredAt: Date;
  readonly aggregateType = 'User';

  constructor(
    readonly aggregateId: string,
    readonly userId: string,
    readonly oldEmail: string,
    readonly newEmail: string
  ) {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
  }
}
