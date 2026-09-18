import type { z } from 'zod';

/**
 * A validation error which retains the issues produced by a validator.
 *
 * Keeping the original issues available is useful to HTTP adapters (which
 * can return field errors) while still making the error pleasant to use in
 * application code.
 */
export class ValidationError extends Error {
  public readonly issues: z.ZodIssue[];
  public readonly fieldErrors: Readonly<Record<string, string[]>>;

  constructor(
    message = 'Validation failed',
    issues: readonly z.ZodIssue[] = [],
    fieldErrors?: Readonly<Record<string, string[]>>
  ) {
    super(message);
    this.name = 'ValidationError';
    this.issues = [...issues];
    this.fieldErrors = fieldErrors ?? ValidationError.toFieldErrors(this.issues);
    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }

  private static toFieldErrors(issues: readonly z.ZodIssue[]): Readonly<Record<string, string[]>> {
    const errors: Record<string, string[]> = {};
    for (const issue of issues) {
      const field = issue.path.length > 0 ? issue.path.join('.') : '_root';
      (errors[field] ??= []).push(issue.message);
    }
    return errors;
  }
}
