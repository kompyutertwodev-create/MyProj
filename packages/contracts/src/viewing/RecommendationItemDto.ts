import { z } from 'zod';

export const RecommendationItemDtoSchema = z.object({
  content: z.object({}).passthrough(),
  score: z.number(),
  reason: z.string().optional(),
});
export type RecommendationItemDto = z.infer<typeof RecommendationItemDtoSchema>;
