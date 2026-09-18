import { z } from 'zod';

export const BalanceResponseSchema = z.object({
  balance: z.number(),
  currency: z.string(),
  pendingBalance: z.number(),
});
export type BalanceResponse = z.infer<typeof BalanceResponseSchema>;
