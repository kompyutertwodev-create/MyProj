import { z } from 'zod';
import { GenreDtoSchema } from './GenreDto';
import { ContentDtoSchema } from './ContentDto';

export const GenreDetailResponseSchema = z.object({
  genre: GenreDtoSchema,
  content: z.array(ContentDtoSchema),
});
export type GenreDetailResponse = z.infer<typeof GenreDetailResponseSchema>;
