import { z } from 'zod';

/**
 * A named collection of Zod schemas. This is useful for applications that
 * keep request, command, or event schemas together.
 */
export type ZodSchemas = Readonly<Record<string, z.ZodTypeAny>>;

/** Infer the output types represented by a schema collection. */
export type InferZodSchemas<TSchemas extends ZodSchemas> = {
  [K in keyof TSchemas]: z.infer<TSchemas[K]>;
};

/** Create a readonly schema collection with type inference preserved. */
export function createZodSchemas<TSchemas extends ZodSchemas>(schemas: TSchemas): TSchemas {
  return schemas;
}
