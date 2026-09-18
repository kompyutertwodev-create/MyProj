import { z } from 'zod';

export const ContinueWatchingItemDtoSchema = z.object({
  contentId: z.string(),
  title: z.string(),
  posterUrl: z.string(),
  progress: z.number(),
  lastWatchedAt: z.string().datetime(),
  remainingTime: z.number(),
  content: z.unknown(),
});
export type ContinueWatchingItemDto = z.infer<typeof ContinueWatchingItemDtoSchema>;
