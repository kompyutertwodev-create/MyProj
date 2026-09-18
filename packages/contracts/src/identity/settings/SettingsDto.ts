import { z } from 'zod';

export const SettingsDtoSchema = z.object({
  autoPlay: z.boolean(),
  autoplayNext: z.boolean(),
  quality: z.enum(['auto', '1080p', '720p', '480p']),
  subtitles: z.boolean(),
  subtitleLanguage: z.string(),
  audioLanguage: z.string(),
  parentalControl: z.boolean(),
  contentFilter: z.object({
    maturityLevel: z.string(),
    blockedGenres: z.array(z.string()),
  }),
});
export type SettingsDto = z.infer<typeof SettingsDtoSchema>;
