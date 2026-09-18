import { z } from 'zod';

export const OAuthProviderSchema = z.enum([
  'google',
  'github',
  'facebook',
  'telegram',
  'microsoft',
  'apple',
]);

export const LinkAccountRequestSchema = z.object({
  provider: z.string().transform((val) => OAuthProviderSchema.parse(val)),
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().optional(),
});

export type LinkAccountRequest = z.infer<typeof LinkAccountRequestSchema>;
