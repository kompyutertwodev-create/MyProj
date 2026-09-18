import { ApplicationError } from './ApplicationError.js';

export class UnauthorizedError extends ApplicationError {
  constructor(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    super(message, 401, code);
  }
}
