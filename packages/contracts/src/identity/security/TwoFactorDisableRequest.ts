import { z } from 'zod';

export const TwoFactorDisableRequestSchema = z.object({
  code: z.string(),
});
export type TwoFactorDisableRequest = z.infer<typeof TwoFactorDisableRequestSchema>;
