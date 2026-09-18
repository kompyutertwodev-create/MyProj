import { z } from 'zod';

export const GetSimilarRequestSchema = z.object({
  limit: z.number().optional(),
});
export type GetSimilarRequest = z.infer<typeof GetSimilarRequestSchema>;
