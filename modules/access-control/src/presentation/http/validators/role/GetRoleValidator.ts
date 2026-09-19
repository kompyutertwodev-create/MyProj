import { z } from 'zod';

/** Request schema for `GET /roles/:id`. */
export const GetRoleRequestSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});