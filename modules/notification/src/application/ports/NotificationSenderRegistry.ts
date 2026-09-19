import type { NotificationChannel } from '../../domain/NotificationChannel.js';
import type { NotificationSender } from './NotificationSender.js';

/**
 * Port: a registry that resolves a NotificationSender by channel.
 * The application layer uses this to dispatch a notification to the right sender.
 */
export interface NotificationSenderRegistry {
  get(channel: NotificationChannel): NotificationSender | null;
  has(channel: NotificationChannel): boolean;
  register(sender: NotificationSender): void;
}
