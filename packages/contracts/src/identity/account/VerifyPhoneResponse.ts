import { z } from 'zod';

export const VerifyPhoneResponseSchema = z.object({
  verified: z.literal(true),
});
export type VerifyPhoneResponse = z.infer<typeof VerifyPhoneResponseSchema>;
