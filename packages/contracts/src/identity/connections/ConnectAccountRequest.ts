import { z } from 'zod';

export const ConnectAccountRequestSchema = z.object({
  code: z.string(),
});
export type ConnectAccountRequest = z.infer<typeof ConnectAccountRequestSchema>;
