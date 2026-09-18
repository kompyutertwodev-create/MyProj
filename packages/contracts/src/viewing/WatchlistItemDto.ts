import { z } from 'zod';

export const WatchlistItemDtoSchema = z.object({
  contentId: z.string(),
  addedAt: z.string().datetime(),
  content: z.object({}).passthrough(),
});
export type WatchlistItemDto = z.infer<typeof WatchlistItemDtoSchema>;
