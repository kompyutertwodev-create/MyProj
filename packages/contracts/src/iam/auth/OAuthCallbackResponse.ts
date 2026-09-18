import { z } from 'zod';
import { AuthUserDtoSchema } from './AuthUserDto';

export const OAuthCallbackResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: AuthUserDtoSchema,
});
export type OAuthCallbackResponse = z.infer<typeof OAuthCallbackResponseSchema>;
