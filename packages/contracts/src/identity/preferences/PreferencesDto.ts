import { z } from 'zod';

export const PreferencesDtoSchema = z.object({
  language: z.string(),
  theme: z.string(),
  notifications: z.string(),
  privacy: z.string(),
  contentPreferences: z.object({
    genres: z.array(z.string()),
    languages: z.array(z.string()),
    maturityLevel: z.string(),
  }),
  emailPreferences: z.object({
    marketing: z.boolean(),
    updates: z.boolean(),
  }),
  pushPreferences: z.object({
    all: z.boolean(),
    comments: z.boolean(),
    likes: z.boolean(),
  }),
});
export type PreferencesDto = z.infer<typeof PreferencesDtoSchema>;
