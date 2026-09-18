import { z } from 'zod';

export const MarkAsReadResponseSchema = z.object({
  read: z.literal(true),
  readAt: z.string().datetime(),
});
export type MarkAsReadResponse = z.infer<typeof MarkAsReadResponseSchema>;
