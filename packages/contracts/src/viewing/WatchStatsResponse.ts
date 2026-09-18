import { z } from 'zod';

export const WatchStatsResponseSchema = z.object({
  totalWatched: z.number(),
  totalWatchTime: z.number(),
  averageWatchTime: z.number(),
  totalMovies: z.number(),
  totalSeries: z.number(),
});
export type WatchStatsResponse = z.infer<typeof WatchStatsResponseSchema>;
