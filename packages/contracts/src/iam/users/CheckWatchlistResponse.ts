import { z } from 'zod';

export const CheckWatchlistResponseSchema = z.object({
  inWatchlist: z.boolean(),
});
export type CheckWatchlistResponse = z.infer<typeof CheckWatchlistResponseSchema>;
