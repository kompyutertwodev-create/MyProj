import { z } from 'zod';

export const VerifyResetTokenResponseSchema = z.object({
  valid: z.literal(true),
  email: z.string().email(),
});
export type VerifyResetTokenResponse = z.infer<typeof VerifyResetTokenResponseSchema>;
