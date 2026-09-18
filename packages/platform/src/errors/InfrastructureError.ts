import { ApplicationError } from './ApplicationError.js';

export class InfrastructureError extends ApplicationError {
  constructor(message = 'Infrastructure Error', code = 'INFRASTRUCTURE_ERROR') {
    super(message, 500, code, false);
  }
}
