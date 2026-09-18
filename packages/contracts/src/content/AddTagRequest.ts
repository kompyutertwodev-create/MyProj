import { z } from 'zod';

export const AddTagRequestSchema = z.object({
  tag: z.string(),
});

export type AddTagRequest = z.infer<typeof AddTagRequestSchema>;
