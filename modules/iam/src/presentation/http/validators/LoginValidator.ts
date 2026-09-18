import { z } from 'zod';

export const LoginRequestSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
    deviceInfo: z.object({
      deviceId: z.string().min(1),
      deviceName: z.string().min(1),
      deviceType: z.string().min(1),
      ipAddress: z.string().min(1),
      userAgent: z.string().min(1),
    }),
  }),
});
