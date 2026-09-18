import { z } from 'zod';

export const OAuthCallbackQuerySchema = z.object({
  code: z.string(),
  state: z.string(),
});
export type OAuthCallbackQuery = z.infer<typeof OAuthCallbackQuerySchema>;
