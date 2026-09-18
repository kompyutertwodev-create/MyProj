import { z } from 'zod';
import { MediaDtoSchema } from './MediaDto';

export const UploadMediaResponseSchema = MediaDtoSchema;
export type UploadMediaResponse = z.infer<typeof UploadMediaResponseSchema>;
