import { z } from 'zod';

export const HistoryItemDtoSchema = z.object({
  id: z.string(),
  contentId: z.string(),
  progress: z.number(),
  duration: z.number(),
  completed: z.boolean(),
  watchedAt: z.string().datetime(),
});
export type HistoryItemDto = z.infer<typeof HistoryItemDtoSchema>;
