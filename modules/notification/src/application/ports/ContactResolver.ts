import type { NotificationChannel } from '../../domain/NotificationChannel.js';

export interface ResolvedContact {
  channel: NotificationChannel;
  value: string;
}

/**
 * Port: resolves the destination address for a recipient on a given channel.
 *
 * Implemented in the composition root (apps/api), where it can query the
 * iam module or any other source of contact information. The notification
 * module never imports foreign domain modules directly.
 */
export interface ContactResolver {
  resolve(recipientId: string, channel: NotificationChannel): Promise<ResolvedContact | null>;
}
