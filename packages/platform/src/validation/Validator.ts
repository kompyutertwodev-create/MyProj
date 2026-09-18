import type { ValidationResult } from './ValidationResult.js';

/**
 * Contract implemented by validation adapters.
 *
 * Validators accept unknown input deliberately: data commonly comes from
 * requests, environment variables, or message payloads.
 */
export interface Validator<T> {
  validate(value: unknown): ValidationResult<T>;
  parse(value: unknown): T;
  isValid(value: unknown): boolean;
}
