import { z } from 'zod';

export const OAuthUnlinkRequestSchema = z.object({
  password: z.string().min(1),
});
export type OAuthUnlinkRequest = z.infer<typeof OAuthUnlinkRequestSchema>;
