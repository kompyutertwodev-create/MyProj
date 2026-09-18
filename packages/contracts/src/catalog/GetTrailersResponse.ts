import { z } from 'zod';
import { TrailerDtoSchema } from './TrailerDto';

export const GetTrailersResponseSchema = z.array(TrailerDtoSchema);
export type GetTrailersResponse = z.infer<typeof GetTrailersResponseSchema>;
