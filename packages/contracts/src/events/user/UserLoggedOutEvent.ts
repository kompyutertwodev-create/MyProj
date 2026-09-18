import { z } from 'zod';

export const UserLoggedOutEventSchema = z.object({
  eventId: z.string(),
  userId: z.string(),
  sessionId: z.string().optional(),
  occurredAt: z.string().datetime(),
});
export type UserLoggedOutEvent = z.infer<typeof UserLoggedOutEventSchema>;
