import { ApplicationError } from './ApplicationError.js';

export class BadRequestError extends ApplicationError {
  constructor(message = 'Bad Request', code = 'BAD_REQUEST') {
    super(message, 400, code);
  }
}
