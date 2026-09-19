import { z } from 'zod';

/** Request schema for `GET /roles/:roleId/assignments`. */
export const ListRoleAssignmentsRequestSchema = z.object({
  params: z.object({
    roleId: z.string().uuid(),
  }),
  query: z.object({
    includeInactive: z
      .union([z.boolean(), z.enum(['true', 'false'])])
      .transform((v) => (typeof v === 'boolean' ? v : v === 'true'))
      .optional(),
  }),
});