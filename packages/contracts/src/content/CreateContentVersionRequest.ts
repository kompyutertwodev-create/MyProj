import { z } from 'zod';

export const CreateContentVersionRequestSchema = z.object({
  changes: z.string(),
});

export type CreateContentVersionRequest = z.infer<typeof CreateContentVersionRequestSchema>;
