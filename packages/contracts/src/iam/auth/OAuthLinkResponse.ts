import { z } from 'zod';

export const OAuthLinkResponseSchema = z.object({
  linked: z.literal(true),
});
export type OAuthLinkResponse = z.infer<typeof OAuthLinkResponseSchema>;
