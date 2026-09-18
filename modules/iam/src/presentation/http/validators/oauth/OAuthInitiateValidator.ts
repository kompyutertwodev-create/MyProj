import { z } from 'zod';

export const OAuthProviderSchema = z.enum([
  'google',
  'github',
  'facebook',
  'telegram',
  'microsoft',
  'apple',
]);

export const OAuthInitiateRequestSchema = z.object({
  provider: z.string().transform((val) => OAuthProviderSchema.parse(val)),
  redirectUri: z.string().url().optional(),
});

export type OAuthInitiateRequest = z.infer<typeof OAuthInitiateRequestSchema>;
