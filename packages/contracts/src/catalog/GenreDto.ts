import { z } from 'zod';

export const GenreDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),
  count: z.number().int().optional(),
});
export type GenreDto = z.infer<typeof GenreDtoSchema>;
