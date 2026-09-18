import { z } from 'zod';

export const GetCdnUrlResponseSchema = z.object({
  url: z.string(),
});
export type GetCdnUrlResponse = z.infer<typeof GetCdnUrlResponseSchema>;
