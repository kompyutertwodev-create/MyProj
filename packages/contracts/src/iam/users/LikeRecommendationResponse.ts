import { z } from 'zod';

export const LikeRecommendationResponseSchema = z.object({
  liked: z.literal(true),
});
export type LikeRecommendationResponse = z.infer<typeof LikeRecommendationResponseSchema>;
