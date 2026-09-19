import type { NotificationChannel } from '../../../domain/NotificationChannel.js';
import type { NotificationStatus } from '../../../domain/NotificationStatus.js';

export interface ListNotificationsQuery {
  page: number;
  pageSize: number;
  recipientId?: string;
  channel?: NotificationChannel;
  status?: NotificationStatus;
  from?: Date;
  to?: Date;
}
