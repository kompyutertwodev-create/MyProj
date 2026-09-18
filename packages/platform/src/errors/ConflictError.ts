import { ApplicationError } from './ApplicationError.js';

export class ConflictError extends ApplicationError {
  constructor(message = 'Conflict', code = 'CONFLICT') {
    super(message, 409, code);
  }
}
