import { z } from 'zod';

export const OAuthLoginResponseSchema = z.object({
  redirectUrl: z.string(),
});
export type OAuthLoginResponse = z.infer<typeof OAuthLoginResponseSchema>;
