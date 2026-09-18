import { z } from 'zod';

export const ClearWatchlistRequestSchema = z.object({
  confirmation: z.boolean(),
});
export type ClearWatchlistRequest = z.infer<typeof ClearWatchlistRequestSchema>;
