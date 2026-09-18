import { ValueObject } from '@workspace/kernel';

interface PasswordHashProps {
  value: string;
}

export class PasswordHash extends ValueObject<PasswordHashProps> {
  private constructor(props: PasswordHashProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  static create(hash: string): PasswordHash {
    return new PasswordHash({ value: hash });
  }

  toString(): string {
    return '[REDACTED]';
  }
}
