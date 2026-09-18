import { z } from 'zod';

export const GetStreamUrlResponseSchema = z.object({
  url: z.string(),
  expiresIn: z.number(),
});
export type GetStreamUrlResponse = z.infer<typeof GetStreamUrlResponseSchema>;
