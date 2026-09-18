import { z } from 'zod';

export const CrewMemberDtoSchema = z.object({
  personId: z.string(),
  name: z.string(),
  role: z.string(),
  department: z.string().optional(),
  image: z.string().optional(),
});
export type CrewMemberDto = z.infer<typeof CrewMemberDtoSchema>;
