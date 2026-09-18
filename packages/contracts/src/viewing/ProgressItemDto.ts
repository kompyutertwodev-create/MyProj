import { z } from 'zod';

export const ProgressItemDtoSchema = z.object({
  contentId: z.string(),
  progress: z.number(),
  duration: z.number(),
  completed: z.boolean(),
  lastWatchedAt: z.string().datetime(),
});
export type ProgressItemDto = z.infer<typeof ProgressItemDtoSchema>;
