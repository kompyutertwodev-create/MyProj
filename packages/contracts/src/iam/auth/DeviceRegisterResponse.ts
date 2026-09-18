import { z } from 'zod';

export const DeviceRegisterResponseSchema = z.object({
  deviceId: z.string(),
  isTrusted: z.boolean(),
});
export type DeviceRegisterResponse = z.infer<typeof DeviceRegisterResponseSchema>;
