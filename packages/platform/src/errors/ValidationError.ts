import { ApplicationError } from './ApplicationError.js';

export class ValidationError extends ApplicationError {
  public readonly fieldErrors: Record<string, string[]>;

  constructor(
    message = 'Validation Failed',
    fieldErrors: Record<string, string[]> = {},
    code = 'VALIDATION_ERROR'
  ) {
    super(message, 422, code);
    this.fieldErrors = fieldErrors;
  }
}
