import { z } from 'zod';

export const GetContentListRequestSchema = z.object({
  type: z.enum(['movie', 'series', 'episode']).optional(),
  genre: z.string().optional(),
  year: z.number().optional(),
  country: z.string().optional(),
  language: z.string().optional(),
  status: z.enum(['published', 'draft', 'archived']).optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
  sort: z.enum(['title', 'rating', 'releaseYear', 'popularity', 'createdAt']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});
export type GetContentListRequest = z.infer<typeof GetContentListRequestSchema>;
