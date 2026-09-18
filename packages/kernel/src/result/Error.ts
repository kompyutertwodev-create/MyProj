/**
 * Canonical application-level error codes.
 * Domain-specific codes are defined inside each module's DomainError subclasses.
 */
export enum ErrorCode {
  NotFound = 'NOT_FOUND',
  Unauthorized = 'UNAUTHORIZED',
  Forbidden = 'FORBIDDEN',
  Conflict = 'CONFLICT',
  Validation = 'VALIDATION',
  Internal = 'INTERNAL',
  Timeout = 'TIMEOUT',
  Unavailable = 'UNAVAILABLE',
}
