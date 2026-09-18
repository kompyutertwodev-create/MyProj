import { z } from 'zod';

export const WatchlistItemDtoSchema = z.object({
  id: z.string(),
  contentId: z.string(),
  addedAt: z.string().datetime(),
});
export type WatchlistItemDto = z.infer<typeof WatchlistItemDtoSchema>;
