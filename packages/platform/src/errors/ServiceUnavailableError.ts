import { ApplicationError } from './ApplicationError.js';

export class ServiceUnavailableError extends ApplicationError {
  constructor(message = 'Service Unavailable', code = 'SERVICE_UNAVAILABLE') {
    super(message, 503, code);
  }
}
