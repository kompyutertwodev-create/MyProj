import { z } from 'zod';

export const DeviceRegisterRequestSchema = z.object({
  deviceId: z.string(),
  name: z.string(),
  type: z.enum(['mobile', 'tablet', 'desktop', 'tv']),
  os: z.string(),
  osVersion: z.string(),
  appVersion: z.string(),
  pushToken: z.string().optional(),
});
export type DeviceRegisterRequest = z.infer<typeof DeviceRegisterRequestSchema>;
