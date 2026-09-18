import { z } from 'zod';

export const DeviceTrustRequestSchema = z.object({
  deviceId: z.string(),
  code: z.string(),
});
export type DeviceTrustRequest = z.infer<typeof DeviceTrustRequestSchema>;
