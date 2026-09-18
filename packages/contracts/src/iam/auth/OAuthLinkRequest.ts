import { z } from 'zod';

export const OAuthLinkRequestSchema = z.object({
  code: z.string(),
});
export type OAuthLinkRequest = z.infer<typeof OAuthLinkRequestSchema>;
