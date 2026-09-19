import type { ContactResolver, ResolvedContact } from '@workspace/notification';
import { NotificationChannel } from '@workspace/notification';
import type { GetUserHandler } from '@workspace/iam';

/**
 * ContactResolver implementation for apps/api.
 *
 * Uses iam's public GetUserHandler (read model) rather than the domain
 * repository interface, keeping module boundaries clean.
 */
export class ApiContactResolver implements ContactResolver {
  constructor(private readonly getUser: GetUserHandler) {}

  async resolve(
    recipientId: string,
    channel: NotificationChannel
  ): Promise<ResolvedContact | null> {
    if (channel !== NotificationChannel.Email) return null;
    const user = await this.getUser.execute({ userId: recipientId });
    if (!user) return null;
    return { channel, value: user.email };
  }
}
