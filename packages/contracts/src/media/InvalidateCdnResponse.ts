import { z } from 'zod';

export const InvalidateCdnResponseSchema = z.object({
  invalidated: z.literal(true),
});
export type InvalidateCdnResponse = z.infer<typeof InvalidateCdnResponseSchema>;
