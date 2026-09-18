import { z } from 'zod';

export const SeasonDtoSchema = z.object({
  id: z.string(),
  number: z.number().int(),
  title: z.string().optional(),
  overview: z.string().optional(),
  episodeCount: z.number().int().optional(),
  posterUrl: z.string().optional(),
});
export type SeasonDto = z.infer<typeof SeasonDtoSchema>;
