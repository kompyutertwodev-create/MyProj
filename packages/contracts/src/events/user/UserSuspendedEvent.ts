import { z } from 'zod';

export const UserSuspendedEventSchema = z.object({
  eventId: z.string(),
  userId: z.string(),
  reason: z.string().optional(),
  occurredAt: z.string().datetime(),
});
export type UserSuspendedEvent = z.infer<typeof UserSuspendedEventSchema>;
