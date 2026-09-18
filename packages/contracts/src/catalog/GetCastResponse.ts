import { z } from 'zod';
import { CastMemberDtoSchema } from './CastMemberDto';

export const GetCastResponseSchema = z.array(CastMemberDtoSchema);
export type GetCastResponse = z.infer<typeof GetCastResponseSchema>;
