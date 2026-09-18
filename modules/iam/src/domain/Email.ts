import { ValueObject, DomainError, Result, ok, err } from '@workspace/kernel';

interface EmailProps {
  value: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email extends ValueObject<EmailProps> {
  private constructor(props: EmailProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  static create(value: string): Result<Email, DomainError> {
    if (!value || value.trim().length === 0) {
      return err(new DomainError('EMAIL_EMPTY', 'Email cannot be empty'));
    }
    const normalized = value.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalized)) {
      return err(new DomainError('EMAIL_INVALID', `Invalid email format: ${value}`));
    }
    if (normalized.length > 254) {
      return err(new DomainError('EMAIL_TOO_LONG', 'Email cannot exceed 254 characters'));
    }
    return ok(new Email({ value: normalized }));
  }

  toString(): string {
    return this.props.value;
  }
}
