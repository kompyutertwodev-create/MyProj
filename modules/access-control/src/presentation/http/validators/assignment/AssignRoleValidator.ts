import { z } from 'zod';

/**
 * Request schema for `POST /assignments`.
 *
 * `expiresAt` is accepted as an ISO-8601 string and coerced to a Date so
 * the handler can work with a real timestamp.
 */
export const AssignRoleRequestSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
    roleId: z.string().uuid(),
    assignedBy: z.string().uuid(),
    tenantId: z.string().uuid().nullable().optional(),
    expiresAt: z
      .string()
      .datetime()
      .transform((s) => new Date(s))
      .nullable()
      .optional(),
  }),
});