import { z } from 'zod';

/**
 * Request schema for `POST /permissions/check`.
 *
 * `resource` and `action` are kept separate so the API matches the
 * internal evaluator contract вЂ” callers cannot smuggle a colon-prefixed
 * combined string through.
 */
export const CheckPermissionRequestSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
    resource: z.string().min(1),
    action: z.string().min(1),
    resourceAttributes: z.record(z.unknown()).optional(),
    environmentAttributes: z.record(z.unknown()).optional(),
  }),
});