import { ApplicationError } from './ApplicationError.js';

export class ForbiddenError extends ApplicationError {
  constructor(message = 'Forbidden', code = 'FORBIDDEN') {
    super(message, 403, code);
  }
}
