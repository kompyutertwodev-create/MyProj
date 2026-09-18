/**
 * Assertion helper — throws if condition is falsy.
 * Use for invariants that should never fail in production.
 */
export function assert(condition: unknown, message = 'Assertion failed'): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
