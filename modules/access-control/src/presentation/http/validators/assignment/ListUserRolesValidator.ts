import { z } from 'zod';

/** Request schema for `GET /users/:userId/roles`. */
export const ListUserRolesRequestSchema = z.object({
  params: z.object({
    userId: z.string().uuid(),
  }),
  query: z.object({
    includeInactive: z
      .union([z.boolean(), z.enum(['true', 'false'])])
      .transform((v) => (typeof v === 'boolean' ? v : v === 'true'))
      .optional(),
  }),
});