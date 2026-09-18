import { z } from 'zod';

export const CreateContentRequestSchema = z.object({
  title: z.string(),
  originalTitle: z.string().optional(),
  type: z.enum(['movie', 'series', 'episode']),
  synopsis: z.string(),
  releaseYear: z.number().int(),
  duration: z.number().optional(),
  posterUrl: z.string().optional(),
  backdropUrl: z.string().optional(),
  trailerUrl: z.string().optional(),
  maturityRating: z.string().optional(),
  genres: z.array(z.string()),
  tags: z.array(z.string()),
  cast: z.array(
    z.object({
      personId: z.string(),
      characterName: z.string(),
    })
  ),
  crew: z.array(
    z.object({
      personId: z.string(),
      role: z.string(),
    })
  ),
  metadata: z.record(z.unknown()),
});

export type CreateContentRequest = z.infer<typeof CreateContentRequestSchema>;
