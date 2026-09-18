import { z } from 'zod';

export const OAuthProviderSchema = z.enum([
  'google',
  'github',
  'facebook',
  'telegram',
  'microsoft',
  'apple',
]);

export const OAuthCallbackRequestSchema = z.object({
  provider: z.string().transform((val) => OAuthProviderSchema.parse(val)),
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().optional(),
  error: z.string().optional(),
});

export type OAuthCallbackRequest = z.infer<typeof OAuthCallbackRequestSchema>;
