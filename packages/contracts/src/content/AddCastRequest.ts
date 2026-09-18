import { z } from 'zod';

export const AddCastRequestSchema = z.object({
  personId: z.string(),
  characterName: z.string(),
});

export type AddCastRequest = z.infer<typeof AddCastRequestSchema>;
