import type { NotificationChannel } from '../../../domain/NotificationChannel.js';
import type { NotificationStatus } from '../../../domain/NotificationStatus.js';

export interface SendNotificationResult {
  notificationId: string;
  status: NotificationStatus;
  channel: NotificationChannel;
  sentAt: string | null;
  errorMessage: string | null;
}
