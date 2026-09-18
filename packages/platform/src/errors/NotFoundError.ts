import { ApplicationError } from './ApplicationError.js';

export class NotFoundError extends ApplicationError {
  constructor(message = 'Not Found', code = 'NOT_FOUND') {
    super(message, 404, code);
  }
}
