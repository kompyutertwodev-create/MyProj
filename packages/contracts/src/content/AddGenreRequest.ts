import { z } from 'zod';

export const AddGenreRequestSchema = z.object({
  genreId: z.string(),
});

export type AddGenreRequest = z.infer<typeof AddGenreRequestSchema>;
