import { z } from 'zod';

export const GetEpisodesRequestSchema = z.object({
  season: z.number().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
});
export type GetEpisodesRequest = z.infer<typeof GetEpisodesRequestSchema>;
