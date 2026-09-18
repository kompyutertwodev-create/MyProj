import { z } from 'zod';

export const DownloadInvoiceResponseSchema = z.object({
  downloadUrl: z.string(),
});
export type DownloadInvoiceResponse = z.infer<typeof DownloadInvoiceResponseSchema>;
