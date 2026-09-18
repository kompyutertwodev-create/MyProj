import { z } from 'zod';

export const ArchiveNotificationResponseSchema = z.object({
  archived: z.literal(true),
});
export type ArchiveNotificationResponse = z.infer<typeof ArchiveNotificationResponseSchema>;
