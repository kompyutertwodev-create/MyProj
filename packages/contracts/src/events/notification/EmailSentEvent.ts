import { z } from 'zod';

export const EmailSentEventSchema = z.object({
  eventId: z.string(),
  notificationId: z.string(),
  userId: z.string().optional(),
  to: z.string().email(),
  subject: z.string(),
  occurredAt: z.string().datetime(),
});
export type EmailSentEvent = z.infer<typeof EmailSentEventSchema>;
