import { z } from 'zod';
import { EpisodeDtoSchema } from './EpisodeDto';
import { SeasonDtoSchema } from './SeasonDto';
import { ContentDtoSchema } from './ContentDto';

export const EpisodeDetailResponseSchema = z.object({
  episode: EpisodeDtoSchema,
  season: SeasonDtoSchema,
  series: ContentDtoSchema,
});
export type EpisodeDetailResponse = z.infer<typeof EpisodeDetailResponseSchema>;
