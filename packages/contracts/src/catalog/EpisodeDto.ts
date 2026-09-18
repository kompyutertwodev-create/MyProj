import { z } from 'zod';

export const EpisodeDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  number: z.number().int(),
  seasonNumber: z.number().int().optional(),
  overview: z.string().optional(),
  duration: z.number().int().optional(),
  thumbnailUrl: z.string().optional(),
  airDate: z.string().optional(),
});
export type EpisodeDto = z.infer<typeof EpisodeDtoSchema>;
