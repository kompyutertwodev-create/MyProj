import { z } from 'zod';

export const ConnectedAccountDtoSchema = z.object({
  provider: z.enum(['google', 'facebook', 'apple']),
  connected: z.boolean(),
  email: z.string(),
});
export type ConnectedAccountDto = z.infer<typeof ConnectedAccountDtoSchema>;
