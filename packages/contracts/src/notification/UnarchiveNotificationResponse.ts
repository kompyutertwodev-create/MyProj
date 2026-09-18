import { z } from 'zod';

export const UnarchiveNotificationResponseSchema = z.object({
  unarchived: z.literal(true),
});
export type UnarchiveNotificationResponse = z.infer<typeof UnarchiveNotificationResponseSchema>;
