import { z } from 'zod';
import { CrewMemberDtoSchema } from './CrewMemberDto';

export const GetCrewResponseSchema = z.array(CrewMemberDtoSchema);
export type GetCrewResponse = z.infer<typeof GetCrewResponseSchema>;
