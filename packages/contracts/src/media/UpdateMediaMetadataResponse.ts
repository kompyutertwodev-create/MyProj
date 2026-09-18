import { z } from 'zod';
import { MediaDtoSchema } from './MediaDto';

export const UpdateMediaMetadataResponseSchema = z.object({
  media: MediaDtoSchema,
});
export type UpdateMediaMetadataResponse = z.infer<typeof UpdateMediaMetadataResponseSchema>;
