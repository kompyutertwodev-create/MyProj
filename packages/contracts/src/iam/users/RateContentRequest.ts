import { z } from 'zod';

export const RateContentRequestSchema = z.object({
  contentId: z.string(),
  rating: z.number().int().min(1).max(10),
});
export type RateContentRequest = z.infer<typeof RateContentRequestSchema>;
