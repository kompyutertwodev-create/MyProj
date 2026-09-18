import { z } from 'zod';
import { AuthUserDtoSchema } from './AuthUserDto';

export const RegisterResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  user: AuthUserDtoSchema,
});
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;
