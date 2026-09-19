import { z } from 'zod';

/** Request schema for `POST /policies/:id/deactivate`. */
export const DeactivatePolicyRequestSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    actorId: z.string().min(1),
  }),
});