import { z } from 'zod';
import { TranscodeDtoSchema } from './TranscodeDtoSchema';

export const GetTranscodesResponseSchema = z.array(TranscodeDtoSchema);
export type GetTranscodesResponse = z.infer<typeof GetTranscodesResponseSchema>;
