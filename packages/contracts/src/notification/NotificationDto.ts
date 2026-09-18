import { z } from 'zod';

export const NotificationDtoSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(['email', 'push', 'sms']),
  title: z.string(),
  body: z.string(),
  data: z.record(z.unknown()).optional(),
  read: z.boolean(),
  readAt: z.string().datetime().optional(),
  archived: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type NotificationDto = z.infer<typeof NotificationDtoSchema>;
