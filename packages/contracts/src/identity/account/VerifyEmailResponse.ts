import { z } from 'zod';

export const VerifyEmailResponseSchema = z.object({
  verified: z.literal(true),
});
export type VerifyEmailResponse = z.infer<typeof VerifyEmailResponseSchema>;
