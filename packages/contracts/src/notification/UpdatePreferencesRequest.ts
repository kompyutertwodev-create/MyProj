import { z } from 'zod';

export const UpdatePreferencesRequestSchema = z.object({
  email: z
    .object({
      marketing: z.boolean().optional(),
      updates: z.boolean().optional(),
      activity: z.boolean().optional(),
      recommendations: z.boolean().optional(),
    })
    .optional(),
  push: z
    .object({
      all: z.boolean().optional(),
      comments: z.boolean().optional(),
      likes: z.boolean().optional(),
      newContent: z.boolean().optional(),
      announcements: z.boolean().optional(),
    })
    .optional(),
  sms: z.boolean().optional(),
  telegram: z.boolean().optional(),
  categories: z.record(z.unknown()).optional(),
});
export type UpdatePreferencesRequest = z.infer<typeof UpdatePreferencesRequestSchema>;
