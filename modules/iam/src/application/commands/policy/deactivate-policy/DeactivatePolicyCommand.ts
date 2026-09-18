import { z } from 'zod';

export const DeactivatePolicyCommandSchema = z.object({
  id: z.string().uuid(),
});

export type DeactivatePolicyCommand = z.infer<typeof DeactivatePolicyCommandSchema>;
