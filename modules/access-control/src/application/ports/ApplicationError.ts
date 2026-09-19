/**
 * Base class for all errors raised by the application layer.
 *
 * Application errors are the boundary between "the domain said no" and
 * "the use case could not complete". They carry an HTTP-friendly status
 * code so the presentation layer does not need a translation table.
 */
export class ApplicationError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** 400 вЂ” input failed validation before reaching the domain. */
export class ValidationApplicationError extends ApplicationError {
  constructor(message: string, code = 'VALIDATION_ERROR') {
    super(code, message, 400);
  }
}

/** 404 вЂ” the aggregate or referenced resource does not exist. */
export class NotFoundApplicationError extends ApplicationError {
  constructor(message: string, code = 'NOT_FOUND') {
    super(code, message, 404);
  }
}

/** 409 вЂ” a uniqueness / state-transition conflict. */
export class ConflictApplicationError extends ApplicationError {
  constructor(message: string, code = 'CONFLICT') {
    super(code, message, 409);
  }
}

/** 403 вЂ” the caller is known but lacks the required permission. */
export class ForbiddenApplicationError extends ApplicationError {
  constructor(message: string, code = 'FORBIDDEN') {
    super(code, message, 403);
  }
}

/** 500 вЂ” an unexpected infrastructure / programming failure. */
export class InternalApplicationError extends ApplicationError {
  constructor(message: string, code = 'INTERNAL_ERROR') {
    super(code, message, 500);
  }
}