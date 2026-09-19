import type { NotificationChannel } from '../../domain/NotificationChannel.js';
import type { NotificationStatus } from '../../domain/NotificationStatus.js';

export interface NotificationView {
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
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}
