import { z } from 'zod';

/** Request schema for `GET /policies/:id`. */
export const GetPolicyRequestSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});