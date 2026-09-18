import { z } from 'zod';
import { MediaDtoSchema } from './MediaDto';

export const GetMediaResponseSchema = z.object({
  media: MediaDtoSchema,
});
export type GetMediaResponse = z.infer<typeof GetMediaResponseSchema>;
