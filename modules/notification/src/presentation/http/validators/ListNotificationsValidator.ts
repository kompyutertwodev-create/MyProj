import { z } from 'zod';
import { NotificationChannel } from '../../../domain/NotificationChannel.js';
import { NotificationStatus } from '../../../domain/NotificationStatus.js';

export const ListNotificationsRequestSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    recipientId: z.string().max(255).optional(),
    channel: z.nativeEnum(NotificationChannel).optional(),
    status: z.nativeEnum(NotificationStatus).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  }),
});

export type ListNotificationsRequest = z.infer<typeof ListNotificationsRequestSchema>;
