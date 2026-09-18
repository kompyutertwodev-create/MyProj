import { z } from 'zod';

export const CastMemberSchema = z.object({
  personId: z.string(),
  characterName: z.string(),
});

export const CrewMemberSchema = z.object({
  personId: z.string(),
  role: z.string(),
});

export const ContentDtoSchema = z.object({
  id: z.string(),
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
  cast: z.array(CastMemberSchema),
  crew: z.array(CrewMemberSchema),
  metadata: z.record(z.unknown()),
  status: z.enum(['draft', 'pending', 'published', 'archived']).optional(),
  createdBy: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type CastMember = z.infer<typeof CastMemberSchema>;
export type CrewMember = z.infer<typeof CrewMemberSchema>;
export type ContentDto = z.infer<typeof ContentDtoSchema>;
