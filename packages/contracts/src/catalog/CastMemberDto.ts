import { z } from 'zod';

export const CastMemberDtoSchema = z.object({
  personId: z.string(),
  name: z.string(),
  role: z.string(),
  characterName: z.string().optional(),
  image: z.string().optional(),
});
export type CastMemberDto = z.infer<typeof CastMemberDtoSchema>;
