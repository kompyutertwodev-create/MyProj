import { z } from 'zod';

export const MagicLinkVerifyRequestSchema = z.object({
  token: z.string(),
});
export type MagicLinkVerifyRequest = z.infer<typeof MagicLinkVerifyRequestSchema>;
