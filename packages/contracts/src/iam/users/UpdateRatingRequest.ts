import { z } from 'zod';

export const UpdateRatingRequestSchema = z.object({
  rating: z.number().int().min(1).max(10),
});
export type UpdateRatingRequest = z.infer<typeof UpdateRatingRequestSchema>;
