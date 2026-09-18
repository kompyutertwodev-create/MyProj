import { z } from 'zod';

export const SessionDtoSchema = z.object({
  id: z.string(),
  deviceId: z.string(),
  deviceName: z.string(),
  deviceType: z.string(),
  ipAddress: z.string(),
  location: z.string(),
  userAgent: z.string(),
  lastActiveAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  isCurrent: z.boolean(),
});
export type SessionDto = z.infer<typeof SessionDtoSchema>;
