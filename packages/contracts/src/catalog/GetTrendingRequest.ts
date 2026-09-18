import { z } from 'zod';

export const GetTrendingRequestSchema = z.object({
  type: z.enum(['movie', 'series']).optional(),
  period: z.enum(['day', 'week', 'month']).optional(),
  limit: z.number().optional(),
});
export type GetTrendingRequest = z.infer<typeof GetTrendingRequestSchema>;
