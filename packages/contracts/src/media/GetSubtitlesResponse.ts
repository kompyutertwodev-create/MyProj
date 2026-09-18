import { z } from 'zod';
import { SubtitleDtoSchema } from './SubtitleDto';

export const GetSubtitlesResponseSchema = z.array(SubtitleDtoSchema);
export type GetSubtitlesResponse = z.infer<typeof GetSubtitlesResponseSchema>;
