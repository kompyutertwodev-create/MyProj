import { z } from 'zod';

export const OAuthLoginRequestSchema = z.object({
  provider: z.enum(['google', 'facebook', 'apple']),
});
export type OAuthLoginRequest = z.infer<typeof OAuthLoginRequestSchema>;
