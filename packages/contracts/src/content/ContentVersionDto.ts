import { z } from 'zod';

export const ContentVersionDtoSchema = z.object({
  version: z.number().int(),
  changes: z.string(),
  updatedAt: z.string().datetime(),
  updatedBy: z.string(),
});

export type ContentVersionDto = z.infer<typeof ContentVersionDtoSchema>;
