import { z } from 'zod';

export const PrivacyDtoSchema = z.object({
  profileVisibility: z.enum(['public', 'private', 'friends']),
  showEmail: z.boolean(),
  showPhone: z.boolean(),
  showActivity: z.boolean(),
  allowSearch: z.boolean(),
  allowMessages: z.boolean(),
});
export type PrivacyDto = z.infer<typeof PrivacyDtoSchema>;
