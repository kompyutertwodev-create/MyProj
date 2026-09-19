import { z } from 'zod';
import { NotificationChannel } from '../../../domain/NotificationChannel.js';

export const SendNotificationRequestSchema = z.object({
  body: z.object({
    recipientId: z.string().min(1).max(255),
    channel: z.nativeEnum(NotificationChannel),
    contact: z.string().min(1).max(500),
    subject: z.string().min(1).max(500),
    body: z.string().min(1).max(10_000),
    templateKey: z.string().max(255).nullable().optional(),
    metadata: z.record(z.unknown()).optional(),
  }),
});

export type SendNotificationRequest = z.infer<typeof SendNotificationRequestSchema>;
