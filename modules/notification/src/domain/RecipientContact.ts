import { DomainError, Result, ValueObject, err, ok } from '@workspace/kernel';
import type { NotificationChannel } from './NotificationChannel.js';

interface RecipientContactProps {
  channel: NotificationChannel;
  value: string;
}

/**
 * Value Object: the destination of a notification on a given channel.
 *
 * Examples:
 * - email:    "user@example.com"
 * - telegram: "123456789" (chat id)
 * - sms:      "+998901234567"
 * - push:     "device-token-abc"
 */
export class RecipientContact extends ValueObject<RecipientContactProps> {
  private constructor(props: RecipientContactProps) {
    super(props);
  }

  get channel(): NotificationChannel {
    return this.props.channel;
  }

  get value(): string {
    return this.props.value;
  }

  static create(channel: NotificationChannel, value: string): Result<RecipientContact, DomainError> {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return err(new DomainError('RECIPIENT_CONTACT_EMPTY', 'Recipient contact cannot be empty'));
    }
    return ok(new RecipientContact({ channel, value: trimmed }));
  }
}
