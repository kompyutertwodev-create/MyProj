import { z } from 'zod';

export const UpdatePreferencesRequestSchema = z.object({
  language: z.string().optional(),
  theme: z.string().optional(),
  notifications: z.string().optional(),
  privacy: z.string().optional(),
  contentPreferences: z
    .object({
      genres: z.array(z.string()),
      languages: z.array(z.string()),
      maturityLevel: z.string(),
    })
    .optional(),
  emailPreferences: z
    .object({
      marketing: z.boolean(),
      updates: z.boolean(),
    })
    .optional(),
  pushPreferences: z
    .object({
      all: z.boolean(),
      comments: z.boolean(),
      likes: z.boolean(),
    })
    .optional(),
});
export type UpdatePreferencesRequest = z.infer<typeof UpdatePreferencesRequestSchema>;
