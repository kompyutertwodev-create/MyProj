import { z } from 'zod';

export const WatchlistQueryRequestSchema = z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).optional(),
  sort: z.enum(['added', 'rating']).optional(),
});
export type WatchlistQueryRequest = z.infer<typeof WatchlistQueryRequestSchema>;
