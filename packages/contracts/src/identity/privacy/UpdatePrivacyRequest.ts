import { z } from 'zod';

export const UpdatePrivacyRequestSchema = z.object({
  profileVisibility: z.enum(['public', 'private', 'friends']).optional(),
  showEmail: z.boolean().optional(),
  showPhone: z.boolean().optional(),
  showActivity: z.boolean().optional(),
  allowSearch: z.boolean().optional(),
  allowMessages: z.boolean().optional(),
});
export type UpdatePrivacyRequest = z.infer<typeof UpdatePrivacyRequestSchema>;
