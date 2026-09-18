import { z } from 'zod';

export const OAuthProviderSchema = z.enum([
  'google',
  'github',
  'facebook',
  'telegram',
  'microsoft',
  'apple',
]);

export const InitiateOAuthCommandSchema = z.object({
  provider: OAuthProviderSchema,
  redirectUri: z.string().url().optional(),
});

export type InitiateOAuthCommand = z.infer<typeof InitiateOAuthCommandSchema>;

export interface InitiateOAuthResult {
  authorizationUrl: string;
  state: string;
  provider: string;
}
