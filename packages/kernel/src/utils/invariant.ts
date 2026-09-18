import { DomainError } from '../domain/DomainError.js';

/**
 * Domain invariant guard — throws a DomainError if the condition fails.
 * Use inside entity/aggregate factory methods and business operations.
 */
export function invariant(
  condition: unknown,
  code: string,
  message: string,
  context?: Record<string, unknown>
): asserts condition {
  if (!condition) {
    throw new DomainError(code, message, context);
  }
}
