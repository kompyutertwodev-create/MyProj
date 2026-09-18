import { z } from 'zod';

export const RecommendationFeedbackRequestSchema = z.object({
  feedback: z.enum(['like', 'dislike', 'neutral']),
});
export type RecommendationFeedbackRequest = z.infer<typeof RecommendationFeedbackRequestSchema>;
