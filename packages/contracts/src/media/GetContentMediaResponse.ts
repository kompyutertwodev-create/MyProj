import { z } from 'zod';
import { MediaDtoSchema } from './MediaDto';

export const GetContentMediaResponseSchema = z.object({
  videos: z.array(MediaDtoSchema),
  images: z.array(MediaDtoSchema),
  subtitles: z.array(MediaDtoSchema),
  audio: z.array(MediaDtoSchema),
  thumbnails: z.array(MediaDtoSchema),
});
export type GetContentMediaResponse = z.infer<typeof GetContentMediaResponseSchema>;
