import { z } from 'zod';

export const WatchlistResponseSchema = z.object({
  data: z.array(z.unknown()),
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
});
export type WatchlistResponse = z.infer<typeof WatchlistResponseSchema>;
