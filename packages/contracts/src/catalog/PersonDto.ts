import { z } from 'zod';

export const PersonDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string().optional(),
  biography: z.string().optional(),
  birthDate: z.string().optional(),
  birthPlace: z.string().optional(),
});
export type PersonDto = z.infer<typeof PersonDtoSchema>;
