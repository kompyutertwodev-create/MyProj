import type { ValidationError } from './ValidationError.js';

export interface ValidationSuccess<T> {
  readonly success: true;
  readonly data: T;
}

export interface ValidationFailure {
  readonly success: false;
  readonly error: ValidationError;
  /** The individual issues, provided as a convenience for callers. */
  readonly errors: ValidationError['issues'];
  readonly message: string;
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;
