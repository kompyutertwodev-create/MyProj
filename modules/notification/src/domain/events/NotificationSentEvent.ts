import { randomUUID } from 'node:crypto';
import type { DomainEvent } from '@workspace/kernel';
import type { NotificationChannel } from '../NotificationChannel.js';

export class NotificationSentEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventName = 'notification.sent';
  readonly occurredAt: Date;
  readonly aggregateType = 'Notification';

  constructor(
    readonly aggregateId: string,
    readonly notificationId: string,
    readonly channel: NotificationChannel,
    readonly recipientId: string
  ) {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
  }
}
