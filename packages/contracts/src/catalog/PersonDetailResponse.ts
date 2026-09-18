import { z } from 'zod';
import { PersonDtoSchema } from './PersonDto';
import { ContentDtoSchema } from './ContentDto';

export const PersonDetailResponseSchema = z.object({
  person: PersonDtoSchema,
  filmography: z.array(ContentDtoSchema),
});
export type PersonDetailResponse = z.infer<typeof PersonDetailResponseSchema>;
