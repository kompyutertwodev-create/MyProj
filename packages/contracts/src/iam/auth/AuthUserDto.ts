import { z } from 'zod';

export const AuthUserDtoSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  avatarUrl: z.string().optional(),
  role: z.string(),
});
export type AuthUserDto = z.infer<typeof AuthUserDtoSchema>;
