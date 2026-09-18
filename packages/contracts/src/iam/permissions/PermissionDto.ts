import { z } from 'zod';

export const PermissionDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  resource: z.string(),
  action: z.string(),
});
export type PermissionDto = z.infer<typeof PermissionDtoSchema>;
