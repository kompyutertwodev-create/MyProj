import { z } from 'zod';

export const ResendVerificationRequestSchema = z.object({
  email: z.string().email(),
});
export type ResendVerificationRequest = z.infer<typeof ResendVerificationRequestSchema>;
