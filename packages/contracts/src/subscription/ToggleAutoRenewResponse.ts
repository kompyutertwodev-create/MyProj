import { z } from 'zod';

export const ToggleAutoRenewResponseSchema = z.object({
  autoRenew: z.boolean(),
});
export type ToggleAutoRenewResponse = z.infer<typeof ToggleAutoRenewResponseSchema>;
