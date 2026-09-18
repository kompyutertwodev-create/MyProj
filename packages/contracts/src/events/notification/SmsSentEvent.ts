import { z } from 'zod';

export const SmsSentEventSchema = z.object({
  eventId: z.string(),
  notificationId: z.string(),
  userId: z.string().optional(),
  phone: z.string(),
  occurredAt: z.string().datetime(),
});
export type SmsSentEvent = z.infer<typeof SmsSentEventSchema>;
