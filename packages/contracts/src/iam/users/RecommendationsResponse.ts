import { z } from 'zod';

export const RecommendationsResponseSchema = z.object({
  data: z.array(z.unknown()),
  reason: z.string(),
});
export type RecommendationsResponse = z.infer<typeof RecommendationsResponseSchema>;
