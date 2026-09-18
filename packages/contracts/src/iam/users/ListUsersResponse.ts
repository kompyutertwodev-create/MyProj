import { z } from 'zod';
import { UserDtoSchema } from './UserDto';

export const ListUsersResponseSchema = z.object({
  data: z.array(UserDtoSchema),
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
});
export type ListUsersResponse = z.infer<typeof ListUsersResponseSchema>;
