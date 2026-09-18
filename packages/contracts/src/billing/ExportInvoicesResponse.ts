import { z } from 'zod';

export const ExportInvoicesResponseSchema = z.object({
  downloadUrl: z.string(),
});
export type ExportInvoicesResponse = z.infer<typeof ExportInvoicesResponseSchema>;
