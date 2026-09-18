import { z } from 'zod';

export const ContentDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  type: z.enum(['movie', 'series', 'episode']),
  genre: z.string().optional(),
  year: z.number().int().optional(),
  country: z.string().optional(),
  language: z.string().optional(),
  status: z.enum(['published', 'draft', 'archived']).optional(),
  rating: z.number().optional(),
  releaseYear: z.number().int().optional(),
  popularity: z.number().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type ContentDto = z.infer<typeof ContentDtoSchema>;
