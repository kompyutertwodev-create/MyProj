import { err, ok, type Result } from '@workspace/kernel';
import type { EmailService } from '@workspace/platform';
import { NotificationChannel } from '../../domain/NotificationChannel.js';
import type { Notification } from '../../domain/Notification.js';
import type {
  NotificationSender,
  NotificationSendResult,
} from '../../application/ports/NotificationSender.js';

export interface PlatformEmailSenderOptions {
  emailService: EmailService;
  from?: string;
  /** Optional HTML template wrapper; receives subject and body. */
  htmlWrapper?: (subject: string, body: string) => string;
}

/**
 * Adapter: wraps a platform EmailService (SendGrid, SES, ...) as a NotificationSender.
 */
export class PlatformEmailSender implements NotificationSender {
  readonly channel = NotificationChannel.Email;

  constructor(private readonly options: PlatformEmailSenderOptions) {}

  async send(notification: Notification): Promise<Result<NotificationSendResult, Error>> {
    const html = this.options.htmlWrapper
      ? this.options.htmlWrapper(notification.subject, notification.body)
      : notification.body;

    try {
      const response = await this.options.emailService.send({
        to: notification.contact.value,
        from: this.options.from,
        subject: notification.subject,
        html,
        text: notification.body,
      });
      return ok({ externalId: response.id, rawResponse: { provider: 'platform-email' } });
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
