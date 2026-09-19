import type { Result } from '@workspace/kernel';
import type { Notification } from '../../domain/Notification.js';
import type { NotificationChannel } from '../../domain/NotificationChannel.js';

export interface NotificationSendResult {
  externalId: string | null;
  rawResponse?: Record<string, unknown>;
}

/**
 * Port: a channel-specific sender.
 *
 * Implementations live in infrastructure (e.g. PlatformEmailSender,
 * TelegramBotSender). The application layer depends only on this interface.
 */
export interface NotificationSender {
  readonly channel: NotificationChannel;
  send(notification: Notification): Promise<Result<NotificationSendResult, Error>>;
}
