import { z } from 'zod';

export const SendNotificationResponseSchema = z.object({
  sent: z.literal(true),
  notificationId: z.string(),
});
export type SendNotificationResponse = z.infer<typeof SendNotificationResponseSchema>;
