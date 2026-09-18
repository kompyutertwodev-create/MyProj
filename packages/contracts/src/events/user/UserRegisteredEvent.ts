import { z } from 'zod';

export const UserRegisteredEventSchema = z.object({
  eventId: z.string(),
  userId: z.string(),
  email: z.string().email(),
  occurredAt: z.string().datetime(),
});
export type UserRegisteredEvent = z.infer<typeof UserRegisteredEventSchema>;
