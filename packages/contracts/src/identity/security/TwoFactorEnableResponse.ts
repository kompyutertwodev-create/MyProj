import { z } from 'zod';

export const TwoFactorEnableResponseSchema = z.object({
  secret: z.string(),
  qrCode: z.string(),
});
export type TwoFactorEnableResponse = z.infer<typeof TwoFactorEnableResponseSchema>;
