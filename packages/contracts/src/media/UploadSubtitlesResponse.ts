import { z } from 'zod';
import { SubtitleDtoSchema } from './SubtitleDto';

export const UploadSubtitlesResponseSchema = z.object({
  subtitle: SubtitleDtoSchema,
});
export type UploadSubtitlesResponse = z.infer<typeof UploadSubtitlesResponseSchema>;
