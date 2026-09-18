import { z } from 'zod';

export const EmailChangedEventSchema = z.object({
  eventId: z.string(),
  userId: z.string(),
  email: z.string().email(),
  occurredAt: z.string().datetime(),
});
export type EmailChangedEvent = z.infer<typeof EmailChangedEventSchema>;
