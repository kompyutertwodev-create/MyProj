import { z } from 'zod';

export const TwoFactorVerifyRequestSchema = z.object({
  code: z.string(),
});
export type TwoFactorVerifyRequest = z.infer<typeof TwoFactorVerifyRequestSchema>;
