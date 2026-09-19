import { z } from 'zod';

/** Request schema for `PATCH /roles/:id`. All fields except actor are optional. */
export const UpdateRoleRequestSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    actorId: z.string().min(1),
  }),
});