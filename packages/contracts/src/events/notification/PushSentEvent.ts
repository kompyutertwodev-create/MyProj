import { z } from 'zod';

export const PushSentEventSchema = z.object({
  eventId: z.string(),
  notificationId: z.string(),
  userId: z.string(),
  deviceId: z.string().optional(),
  occurredAt: z.string().datetime(),
});
export type PushSentEvent = z.infer<typeof PushSentEventSchema>;
