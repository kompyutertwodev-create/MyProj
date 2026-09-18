import { z } from 'zod';

export const CreateContentVersionResponseSchema = z.object({
  version: z.number().int(),
});

export type CreateContentVersionResponse = z.infer<typeof CreateContentVersionResponseSchema>;
