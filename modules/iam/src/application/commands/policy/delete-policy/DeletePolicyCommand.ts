import { z } from 'zod';

export const DeletePolicyCommandSchema = z.object({
  id: z.string().uuid(),
});

export type DeletePolicyCommand = z.infer<typeof DeletePolicyCommandSchema>;
