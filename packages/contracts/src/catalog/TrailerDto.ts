import { z } from 'zod';

export const TrailerDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  thumbnail: z.string().optional(),
  duration: z.number().int().optional(),
});
export type TrailerDto = z.infer<typeof TrailerDtoSchema>;
