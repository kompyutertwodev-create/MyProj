import { z } from 'zod';

export const VerifyPhoneRequestSchema = z.object({
  code: z.string(),
});
export type VerifyPhoneRequest = z.infer<typeof VerifyPhoneRequestSchema>;
