import { z } from 'zod';

export const UserActivatedEventSchema = z.object({
  eventId: z.string(),
  userId: z.string(),
  occurredAt: z.string().datetime(),
});
export type UserActivatedEvent = z.infer<typeof UserActivatedEventSchema>;
