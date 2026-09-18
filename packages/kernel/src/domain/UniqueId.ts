import { randomUUID } from 'node:crypto';
import { ValueObject } from './ValueObject.js';

interface UniqueIdProps extends Record<string, unknown> {
  value: string;
}

/**
 * Value object wrapping a string identifier (UUID / CUID2 / ULID).
 * Extend this in modules that want strongly-typed ids (e.g. UserId extends UniqueId).
 */
export class UniqueId extends ValueObject<UniqueIdProps> {
  constructor(value?: string) {
    if (value !== undefined && value.trim() === '') {
      throw new Error('UniqueId value cannot be empty');
    }
    super({ value: value ?? randomUUID() });
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
