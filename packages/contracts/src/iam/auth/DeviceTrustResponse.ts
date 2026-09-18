import { z } from 'zod';

export const DeviceTrustResponseSchema = z.object({
  trusted: z.literal(true),
});
export type DeviceTrustResponse = z.infer<typeof DeviceTrustResponseSchema>;
