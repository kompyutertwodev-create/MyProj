import { z } from 'zod';

export const GenreStatsResponseSchema = z.object({
  contentCount: z.number().int(),
  avgRating: z.number(),
  totalViews: z.number().int(),
});
export type GenreStatsResponse = z.infer<typeof GenreStatsResponseSchema>;
