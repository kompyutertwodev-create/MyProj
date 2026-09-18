import { z } from 'zod';

export const NotificationPreferencesDtoSchema = z.object({
  email: z.object({
    marketing: z.boolean(),
    updates: z.boolean(),
    activity: z.boolean(),
    recommendations: z.boolean(),
  }),
  push: z.object({
    all: z.boolean(),
    comments: z.boolean(),
    likes: z.boolean(),
    newContent: z.boolean(),
    announcements: z.boolean(),
  }),
  sms: z.boolean(),
  telegram: z.boolean(),
  categories: z.record(z.unknown()),
});
export type NotificationPreferencesDto = z.infer<typeof NotificationPreferencesDtoSchema>;
