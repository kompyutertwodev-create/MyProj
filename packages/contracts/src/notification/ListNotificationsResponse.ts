import { z } from 'zod';
import { paginatedResponseSchema } from '../common/Pagination';
import { NotificationDtoSchema } from './NotificationDto';

export const ListNotificationsResponseSchema = paginatedResponseSchema(NotificationDtoSchema);
export type ListNotificationsResponse = z.infer<typeof ListNotificationsResponseSchema>;
