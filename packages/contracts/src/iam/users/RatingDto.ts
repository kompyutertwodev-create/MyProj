import { z } from 'zod';

export const RatingDtoSchema = z.object({
  ratingId: z.string(),
  rating: z.number().int().min(1).max(10),
  createdAt: z.string().datetime(),
});
export type RatingDto = z.infer<typeof RatingDtoSchema>;
