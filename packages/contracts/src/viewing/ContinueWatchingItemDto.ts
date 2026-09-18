import { z } from 'zod';

export const ContinueWatchingItemDtoSchema = z.object({
  contentId: z.string(),
  title: z.string(),
  posterUrl: z.string(),
  progress: z.number(),
  remainingTime: z.number(),
  lastWatchedAt: z.string().datetime(),
  content: z.object({}).passthrough(),
});
export type ContinueWatchingItemDto = z.infer<typeof ContinueWatchingItemDtoSchema>;
