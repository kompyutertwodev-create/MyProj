import { z } from 'zod';

export const UserLoggedInEventSchema = z.object({
  eventId: z.string(),
  userId: z.string(),
  sessionId: z.string().optional(),
  occurredAt: z.string().datetime(),
});
export type UserLoggedInEvent = z.infer<typeof UserLoggedInEventSchema>;
