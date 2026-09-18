import { z } from 'zod';

export const TwoFactorVerifyResponseSchema = z.object({
  enabled: z.literal(true),
});
export type TwoFactorVerifyResponse = z.infer<typeof TwoFactorVerifyResponseSchema>;
