import { z } from 'zod';

export const DeleteNotificationResponseSchema = z.object({
  deleted: z.literal(true),
});
export type DeleteNotificationResponse = z.infer<typeof DeleteNotificationResponseSchema>;
