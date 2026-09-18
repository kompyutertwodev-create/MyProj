import { z } from 'zod';

export const DeleteMediaResponseSchema = z.object({
  deleted: z.literal(true),
});
export type DeleteMediaResponse = z.infer<typeof DeleteMediaResponseSchema>;
