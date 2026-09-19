import { z } from 'zod';

/** Request schema for `DELETE /assignments/:id`. */
export const RevokeRoleRequestSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    revokedBy: z.string().min(1),
    reason: z.string().max(500).optional(),
  }),
});