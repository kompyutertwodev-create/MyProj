import { Notification } from '../../domain/Notification.js';
import { RecipientContact } from '../../domain/RecipientContact.js';
import type { NotificationChannel } from '../../domain/NotificationChannel.js';
import type { NotificationStatus } from '../../domain/NotificationStatus.js';

export interface NotificationPersistence {
  id: string;
  recipientId: string;
  channel: NotificationChannel;
  contactValue: string;
  status: NotificationStatus;
  subject: string;
  body: string;
  templateKey: string | null;
  metadata: Record<string, unknown>;
  errorMessage: string | null;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class NotificationMapper {
  static toDomain(row: NotificationPersistence): Notification {
    const contact = RecipientContact.create(row.channel, row.contactValue);
    if (contact.isErr()) throw contact.error;

    return Notification.reconstruct({
      id: row.id,
      recipientId: row.recipientId,
      contact: contact.value,
      channel: row.channel,
      status: row.status,
      subject: row.subject,
      body: row.body,
      templateKey: row.templateKey,
      metadata: row.metadata,
      errorMessage: row.errorMessage,
      sentAt: row.sentAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toPersistence(notification: Notification): NotificationPersistence {
    return {
      id: notification.id.value,
      recipientId: notification.recipientId.value,
      channel: notification.channel,
      contactValue: notification.contact.value,
      status: notification.status,
      subject: notification.subject,
      body: notification.body,
      templateKey: notification.templateKey,
      metadata: notification.metadata,
      errorMessage: notification.errorMessage,
      sentAt: notification.sentAt,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  }
}
