import type { Notification } from '../Notification.js';
import type { NotificationChannel } from '../NotificationChannel.js';
import type { NotificationStatus } from '../NotificationStatus.js';

export interface NotificationFilter {
  recipientId?: string;
  channel?: NotificationChannel;
  status?: NotificationStatus;
  from?: Date;
  to?: Date;
}

export interface NotificationRepository {
  findById(id: string): Promise<Notification | null>;
  findAll(
    filter: NotificationFilter,
    options: { limit: number; offset: number }
  ): Promise<Notification[]>;
  countAll(filter: NotificationFilter): Promise<number>;
  save(notification: Notification): Promise<void>;
  saveMany(notifications: Notification[]): Promise<void>;
}
