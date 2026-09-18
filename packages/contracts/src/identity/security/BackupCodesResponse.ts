import { z } from 'zod';

export const BackupCodesResponseSchema = z.object({
  codes: z.array(z.string()),
});
export type BackupCodesResponse = z.infer<typeof BackupCodesResponseSchema>;
