import { z } from 'zod';

export const GetPopularRequestSchema = z.object({
  type: z.enum(['movie', 'series']).optional(),
  period: z.enum(['week', 'month', 'year']).optional(),
});
export type GetPopularRequest = z.infer<typeof GetPopularRequestSchema>;
