import { z } from 'zod';

export const OAuthUnlinkResponseSchema = z.object({
  unlinked: z.literal(true),
});
export type OAuthUnlinkResponse = z.infer<typeof OAuthUnlinkResponseSchema>;
