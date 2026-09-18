import { z } from 'zod';

export const TwoFactorDisableResponseSchema = z.object({
  enabled: z.literal(false),
});
export type TwoFactorDisableResponse = z.infer<typeof TwoFactorDisableResponseSchema>;
