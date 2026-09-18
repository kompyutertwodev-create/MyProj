import { z } from 'zod';
import { ContentDtoSchema } from './ContentDto';
import { GenreDtoSchema } from './GenreDto';
import { SeasonDtoSchema } from './SeasonDto';

export const ContentDetailResponseSchema = ContentDtoSchema.extend({
  genres: z.array(GenreDtoSchema).optional(),
  persons: z
    .array(
      z.object({
        personId: z.string(),
        name: z.string(),
        role: z.string(),
        image: z.string().optional(),
      })
    )
    .optional(),
  media: z
    .array(
      z.object({
        id: z.string(),
        type: z.string(),
        url: z.string(),
      })
    )
    .optional(),
  seasons: z.array(SeasonDtoSchema).optional(),
});
export type ContentDetailResponse = z.infer<typeof ContentDetailResponseSchema>;
