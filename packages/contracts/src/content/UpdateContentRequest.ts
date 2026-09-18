import { z } from 'zod';

export const UpdateContentRequestSchema = z.object({
  title: z.string().optional(),
  originalTitle: z.string().optional(),
  type: z.enum(['movie', 'series', 'episode']).optional(),
  synopsis: z.string().optional(),
  releaseYear: z.number().int().optional(),
  duration: z.number().optional(),
  posterUrl: z.string().optional(),
  backdropUrl: z.string().optional(),
  trailerUrl: z.string().optional(),
  maturityRating: z.string().optional(),
  genres: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  cast: z
    .array(
      z.object({
        personId: z.string(),
        characterName: z.string(),
      })
    )
    .optional(),
  crew: z
    .array(
      z.object({
        personId: z.string(),
        role: z.string(),
      })
    )
    .optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type UpdateContentRequest = z.infer<typeof UpdateContentRequestSchema>;
