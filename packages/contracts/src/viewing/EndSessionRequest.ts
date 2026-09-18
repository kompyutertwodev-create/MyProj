import { z } from 'zod';

export const EndSessionRequestSchema = z.object({
  sessionId: z.string(),
});
export type EndSessionRequest = z.infer<typeof EndSessionRequestSchema>;
