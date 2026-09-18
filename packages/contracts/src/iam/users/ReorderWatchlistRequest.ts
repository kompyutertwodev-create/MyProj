import { z } from 'zod';

export const ReorderWatchlistRequestSchema = z.object({
  order: z.array(z.string()),
});
export type ReorderWatchlistRequest = z.infer<typeof ReorderWatchlistRequestSchema>;
