import { z } from 'zod';

export const MarkAsUnreadResponseSchema = z.object({
  read: z.literal(false),
});
export type MarkAsUnreadResponse = z.infer<typeof MarkAsUnreadResponseSchema>;
