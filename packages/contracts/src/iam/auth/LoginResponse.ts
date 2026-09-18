import { z } from 'zod';
import { AuthUserDtoSchema } from './AuthUserDto';

export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  user: AuthUserDtoSchema,
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
