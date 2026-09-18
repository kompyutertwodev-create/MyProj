import { z } from 'zod';

export const StartSessionResponseSchema = z.object({
  sessionId: z.string(),
  streamUrl: z.string(),
  expiresIn: z.number(),
});
export type StartSessionResponse = z.infer<typeof StartSessionResponseSchema>;
