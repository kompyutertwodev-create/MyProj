import { z } from 'zod';

export interface ValidationSuccess<T> {
  success: true;
  data: T;
}

export interface ValidationFailure {
  success: false;
  errors: z.ZodIssue[];
  message: string;
}

export type ConfigValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

export function validateConfig<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ConfigValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.issues,
    message: result.error.message,
  };
}
