import { z } from 'zod';
import { SeasonDtoSchema } from './SeasonDto';
import { EpisodeDtoSchema } from './EpisodeDto';

export const SeasonDetailResponseSchema = z.object({
  season: SeasonDtoSchema,
  episodes: z.array(EpisodeDtoSchema),
});
export type SeasonDetailResponse = z.infer<typeof SeasonDetailResponseSchema>;
