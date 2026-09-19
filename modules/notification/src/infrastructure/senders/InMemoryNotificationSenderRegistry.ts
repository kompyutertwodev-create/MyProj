import type { NotificationChannel } from '../../domain/NotificationChannel.js';
import type { NotificationSender } from '../../application/ports/NotificationSender.js';
import type { NotificationSenderRegistry } from '../../application/ports/NotificationSenderRegistry.js';

/**
 * Simple in-process registry of notification senders, keyed by channel.
 */
export class InMemoryNotificationSenderRegistry implements NotificationSenderRegistry {
  private readonly senders = new Map<NotificationChannel, NotificationSender>();

  get(channel: NotificationChannel): NotificationSender | null {
    return this.senders.get(channel) ?? null;
  }

  has(channel: NotificationChannel): boolean {
    return this.senders.has(channel);
  }

  register(sender: NotificationSender): void {
    this.senders.set(sender.channel, sender);
  }
}
