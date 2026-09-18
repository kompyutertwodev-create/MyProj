import { z } from 'zod';

export const GetNewReleasesRequestSchema = z.object({
  limit: z.number().optional(),
  days: z.number().optional(),
});
export type GetNewReleasesRequest = z.infer<typeof GetNewReleasesRequestSchema>;
