import type { NotificationChannel } from '../../../domain/NotificationChannel.js';

export interface SendNotificationCommand {
  recipientId: string;
  channel: NotificationChannel;
  contact: string;
  subject: string;
  body: string;
  templateKey?: string | null;
  metadata?: Record<string, unknown>;
}
