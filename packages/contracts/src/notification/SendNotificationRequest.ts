import { z } from 'zod';

export const SendNotificationRequestSchema = z.object({
  userId: z.string(),
  type: z.enum(['email', 'push', 'sms']),
  title: z.string().min(1),
  body: z.string().min(1),
  data: z.record(z.unknown()).optional(),
  templateId: z.string().optional(),
  variables: z.record(z.unknown()).optional(),
});
export type SendNotificationRequest = z.infer<typeof SendNotificationRequestSchema>;
