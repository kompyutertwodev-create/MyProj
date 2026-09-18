import { z } from 'zod';

export const MaturityRatingDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  minAge: z.number().int(),
});
export type MaturityRatingDto = z.infer<typeof MaturityRatingDtoSchema>;
