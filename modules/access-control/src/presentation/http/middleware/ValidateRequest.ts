import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodError, type ZodSchema } from 'zod';

/**
 * Request validation middleware backed by Zod.
 *
 * The schema is expected to wrap the parts of the request we care about
 * (`body`, `query`, `params`) and return an object of the same shape. The
 * parsed result is attached to `req.validated` so downstream handlers can
 * read strongly-typed data without re-parsing.
 *
 * On failure we translate the ZodError into a 422 response that matches
 * the rest of the API surface (see apps/api/src/errors.ts).
 */
export function validateRequest(schema: ZodSchema): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      // Express does not type `validated`; augmenting it would require a
      // global declaration. The cast keeps the surface local to this file.
      (req as Request & { validated?: unknown }).validated = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(422).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: error.errors.map((e) => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          },
        });
        return;
      }
      next(error);
    }
  };
}