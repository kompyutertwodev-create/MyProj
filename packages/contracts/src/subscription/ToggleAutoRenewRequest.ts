import { z } from 'zod';

export const ToggleAutoRenewRequestSchema = z.object({
  enabled: z.boolean(),
});
export type ToggleAutoRenewRequest = z.infer<typeof ToggleAutoRenewRequestSchema>;
