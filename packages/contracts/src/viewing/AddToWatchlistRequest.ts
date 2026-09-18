import { z } from 'zod';

export const AddToWatchlistRequestSchema = z.object({
  contentId: z.string(),
});
export type AddToWatchlistRequest = z.infer<typeof AddToWatchlistRequestSchema>;
