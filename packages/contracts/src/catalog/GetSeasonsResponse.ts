import { z } from 'zod';
import { SeasonDtoSchema } from './SeasonDto';

export const GetSeasonsResponseSchema = z.array(SeasonDtoSchema);
export type GetSeasonsResponse = z.infer<typeof GetSeasonsResponseSchema>;
