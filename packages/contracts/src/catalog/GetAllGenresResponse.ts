import { z } from 'zod';
import { GenreDtoSchema } from './GenreDto';

export const GetAllGenresResponseSchema = z.array(GenreDtoSchema);
export type GetAllGenresResponse = z.infer<typeof GetAllGenresResponseSchema>;
