import { z } from 'zod';

export const CreditsBalanceResponseSchema = z.object({
  balance: z.number(),
  expiryDate: z.string().datetime(),
});
export type CreditsBalanceResponse = z.infer<typeof CreditsBalanceResponseSchema>;
