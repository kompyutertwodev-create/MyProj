import { z } from 'zod';

export const ReorderWatchlistResponseSchema = z.object({
  reordered: z.literal(true),
});
export type ReorderWatchlistResponse = z.infer<typeof ReorderWatchlistResponseSchema>;
