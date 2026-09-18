import { z } from 'zod';

export const UpdateSettingsRequestSchema = z.object({
  autoPlay: z.boolean().optional(),
  autoplayNext: z.boolean().optional(),
  quality: z.enum(['auto', '1080p', '720p', '480p']).optional(),
  subtitles: z.boolean().optional(),
  subtitleLanguage: z.string().optional(),
  audioLanguage: z.string().optional(),
  parentalControl: z.boolean().optional(),
  contentFilter: z
    .object({
      maturityLevel: z.string(),
      blockedGenres: z.array(z.string()),
    })
    .optional(),
});
export type UpdateSettingsRequest = z.infer<typeof UpdateSettingsRequestSchema>;
