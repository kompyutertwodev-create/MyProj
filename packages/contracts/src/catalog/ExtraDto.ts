import { z } from 'zod';

export const ExtraDtoSchema = z.object({
  id: z.string(),
  type: z.enum(['trailer', 'behind_scenes', 'interview', 'deleted_scene']),
  title: z.string(),
  url: z.string(),
});
export type ExtraDto = z.infer<typeof ExtraDtoSchema>;
