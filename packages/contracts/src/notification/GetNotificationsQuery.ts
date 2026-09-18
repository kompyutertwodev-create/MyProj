import { z } from 'zod';

export const GetNotificationsQuerySchema = z.object({
  page: z.number().int().optional(),
  limit: z.number().int().optional(),
  unreadOnly: z.boolean().optional(),
  type: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});
export type GetNotificationsQuery = z.infer<typeof GetNotificationsQuerySchema>;
