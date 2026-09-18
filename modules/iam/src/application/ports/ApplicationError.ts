export class ApplicationError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(code: string, message: string, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationApplicationError extends ApplicationError {
  constructor(message: string) {
    super('VALIDATION_ERROR', message, 400);
  }
}

export class ConflictApplicationError extends ApplicationError {
  constructor(message: string) {
    super('CONFLICT', message, 409);
  }
}

export class UnauthorizedApplicationError extends ApplicationError {
  constructor(message: string) {
    super('UNAUTHORIZED', message, 401);
  }
}

export class ForbiddenApplicationError extends ApplicationError {
  constructor(message: string) {
    super('FORBIDDEN', message, 403);
  }
}

export class NotFoundApplicationError extends ApplicationError {
  constructor(message: string) {
    super('NOT_FOUND', message, 404);
  }
}

export class InternalApplicationError extends ApplicationError {
  constructor(message: string) {
    super('INTERNAL_ERROR', message, 500);
  }
}
