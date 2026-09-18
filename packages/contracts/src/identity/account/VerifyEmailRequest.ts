import { z } from 'zod';

export const VerifyEmailRequestSchema = z.object({
  token: z.string(),
});
export type VerifyEmailRequest = z.infer<typeof VerifyEmailRequestSchema>;
