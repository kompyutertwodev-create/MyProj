import { DomainError, Result, ValueObject, err, ok } from '@workspace/kernel';

interface RecipientIdProps {
  value: string;
}

/**
 * Value Object: identifier of the notification recipient.
 * Usually an iam UserId, but can be a system identifier.
 */
export class RecipientId extends ValueObject<RecipientIdProps> {
  private constructor(props: RecipientIdProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  static create(value: string): Result<RecipientId, DomainError> {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return err(new DomainError('RECIPIENT_ID_EMPTY', 'Recipient id cannot be empty'));
    }
    return ok(new RecipientId({ value: trimmed }));
  }

  toString(): string {
    return this.props.value;
  }
}
