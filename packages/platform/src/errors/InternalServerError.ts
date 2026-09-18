import { ApplicationError } from './ApplicationError.js';

export class InternalServerError extends ApplicationError {
  constructor(message = 'Internal Server Error', code = 'INTERNAL_SERVER_ERROR') {
    super(message, 500, code, false);
  }
}
