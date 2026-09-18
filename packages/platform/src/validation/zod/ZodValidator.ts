import { z } from 'zod';
import { ValidationError } from '../ValidationError.js';
import type { ValidationResult } from '../ValidationResult.js';
import type { Validator } from '../Validator.js';

/**
 * Validator adapter for Zod schemas. The schema's output type is returned,
 * allowing transforms and defaults to be represented correctly.
 */
export class ZodValidator<TSchema extends z.ZodTypeAny> implements Validator<z.infer<TSchema>> {
  public readonly schema: TSchema;

  constructor(schema: TSchema) {
    this.schema = schema;
  }

  validate(value: unknown): ValidationResult<z.infer<TSchema>> {
    const result = this.schema.safeParse(value);
    if (result.success) {
      return { success: true, data: result.data };
    }

    const error = new ValidationError(result.error.message, result.error.issues);
    return {
      success: false,
      error,
      errors: error.issues,
      message: error.message,
    };
  }

  parse(value: unknown): z.infer<TSchema> {
    const result = this.validate(value);
    if (!result.success) {
      throw result.error;
    }
    return result.data;
  }

  isValid(value: unknown): boolean {
    return this.schema.safeParse(value).success;
  }

  async validateAsync(value: unknown): Promise<ValidationResult<z.infer<TSchema>>> {
    const result = await this.schema.safeParseAsync(value);
    if (result.success) {
      return { success: true, data: result.data };
    }

    const error = new ValidationError(result.error.message, result.error.issues);
    return {
      success: false,
      error,
      errors: error.issues,
      message: error.message,
    };
  }

  async parseAsync(value: unknown): Promise<z.infer<TSchema>> {
    const result = await this.validateAsync(value);
    if (!result.success) {
      throw result.error;
    }
    return result.data;
  }
}
