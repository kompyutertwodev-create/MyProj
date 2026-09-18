import { z } from 'zod';

export const ViewingAnalyticsResponseSchema = z.object({
  totalViews: z.number(),
  uniqueViewers: z.number(),
  averageWatchTime: z.number(),
  completionRate: z.number(),
  popularTimes: z.array(z.unknown()),
});
export type ViewingAnalyticsResponse = z.infer<typeof ViewingAnalyticsResponseSchema>;
