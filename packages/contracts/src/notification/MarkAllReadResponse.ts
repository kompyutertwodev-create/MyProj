import { z } from 'zod';

export const MarkAllReadResponseSchema = z.object({
  marked: z.literal(true),
});
export type MarkAllReadResponse = z.infer<typeof MarkAllReadResponseSchema>;
