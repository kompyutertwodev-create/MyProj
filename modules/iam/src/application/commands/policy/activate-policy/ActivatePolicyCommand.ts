import { z } from 'zod';

export const ActivatePolicyCommandSchema = z.object({
  id: z.string().uuid(),
});

export type ActivatePolicyCommand = z.infer<typeof ActivatePolicyCommandSchema>;
