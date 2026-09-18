import { z } from 'zod';

export const LogoutRequestSchema = z.object({
  body: z.object({
    sessionId: z.string().uuid('Invalid session ID format'),
  }),
});

export type LogoutRequest = z.infer<typeof LogoutRequestSchema>;
