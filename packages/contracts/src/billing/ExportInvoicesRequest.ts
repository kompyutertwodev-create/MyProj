import { z } from 'zod';

export const ExportInvoicesRequestSchema = z.object({
  format: z.enum(['csv', 'pdf']),
  period: z.object({
    from: z.string().datetime(),
    to: z.string().datetime(),
  }),
});
export type ExportInvoicesRequest = z.infer<typeof ExportInvoicesRequestSchema>;
