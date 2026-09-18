import { z } from 'zod';

export const PasswordChangedEventSchema = z.object({
  eventId: z.string(),
  userId: z.string(),
  occurredAt: z.string().datetime(),
});
export type PasswordChangedEvent = z.infer<typeof PasswordChangedEventSchema>;
