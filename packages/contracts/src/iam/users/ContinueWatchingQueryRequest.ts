import { z } from 'zod';

export const ContinueWatchingQueryRequestSchema = z.object({
  limit: z.number().int().min(1).optional(),
});
export type ContinueWatchingQueryRequest = z.infer<typeof ContinueWatchingQueryRequestSchema>;
