import { z } from 'zod';

/** Request schema for `POST /policies/:id/activate`. */
export const ActivatePolicyRequestSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    actorId: z.string().min(1),
  }),
});