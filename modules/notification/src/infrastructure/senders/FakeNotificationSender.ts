import { err, ok, type Result } from '@workspace/kernel';
import { NotificationChannel } from '../../domain/NotificationChannel.js';
import type { Notification } from '../../domain/Notification.js';
import type {
  NotificationSender,
  NotificationSendResult,
} from '../../application/ports/NotificationSender.js';

export interface SentMessage {
  notificationId: string;
  channel: NotificationChannel;
  recipientId: string;
  contactValue: string;
  subject: string;
  body: string;
  sentAt: Date;
}

export class FakeNotificationSender implements NotificationSender {
  readonly sent: SentMessage[] = [];

  constructor(
    readonly channel: NotificationChannel,
    private readonly failWith?: string
  ) {}

  async send(notification: Notification): Promise<Result<NotificationSendResult, Error>> {
    if (this.failWith) {
      return err(new Error(this.failWith));
    }
    this.sent.push({
      notificationId: notification.id.value,
      channel: this.channel,
      recipientId: notification.recipientId.value,
      contactValue: notification.contact.value,
      subject: notification.subject,
      body: notification.body,
      sentAt: new Date(),
    });
    return ok({ externalId: `fake-${notification.id.value}`, rawResponse: {} });
  }
}
