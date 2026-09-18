import { z } from 'zod';
import { AuthUserDtoSchema } from './AuthUserDto';

export const MagicLinkVerifyResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: AuthUserDtoSchema,
});
export type MagicLinkVerifyResponse = z.infer<typeof MagicLinkVerifyResponseSchema>;
