import { z } from 'zod';

export const SessionResponseSchema = z.object({
  id: z.string(),
  deviceId: z.string(),
  ipAddress: z.string(),
  userAgent: z.string(),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
});
export type SessionResponse = z.infer<typeof SessionResponseSchema>;
