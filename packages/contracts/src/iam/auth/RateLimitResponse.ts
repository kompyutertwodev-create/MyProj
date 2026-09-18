import { z } from 'zod';

export const RateLimitResponseSchema = z.object({
  limit: z.number(),
  remaining: z.number(),
  reset: z.string(),
});
export type RateLimitResponse = z.infer<typeof RateLimitResponseSchema>;
