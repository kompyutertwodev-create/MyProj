import { z } from 'zod';

/** Request schema for `DELETE /roles/:id`. */
export const DeleteRoleRequestSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    actorId: z.string().min(1),
  }),
});