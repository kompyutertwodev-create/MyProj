import { z } from 'zod';
import { EpisodeDtoSchema } from './EpisodeDto';
import { paginatedResponseSchema } from '../common/Pagination';

export const GetEpisodesResponseSchema = paginatedResponseSchema(EpisodeDtoSchema);
export type GetEpisodesResponse = z.infer<typeof GetEpisodesResponseSchema>;
