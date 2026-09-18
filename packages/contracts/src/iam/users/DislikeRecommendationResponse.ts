import { z } from 'zod';

export const DislikeRecommendationResponseSchema = z.object({
  disliked: z.literal(true),
});
export type DislikeRecommendationResponse = z.infer<typeof DislikeRecommendationResponseSchema>;
