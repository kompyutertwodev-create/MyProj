import { ApplicationError } from './ApplicationError.js';

export class TimeoutError extends ApplicationError {
  constructor(message = 'Request Timeout', code = 'TIMEOUT') {
    super(message, 503, code);
  }
}
