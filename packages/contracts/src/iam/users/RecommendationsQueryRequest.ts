import { z } from 'zod';

export const RecommendationsQueryRequestSchema = z.object({
  limit: z.number().int().min(1).optional(),
  type: z.enum(['movie', 'series']).optional(),
});
export type RecommendationsQueryRequest = z.infer<typeof RecommendationsQueryRequestSchema>;
