import { z } from 'zod';

export const ResetPasswordRequestSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(1),
});
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;
