import { z } from 'zod';

export const InvoiceGeneratedEventSchema = z.object({
  eventId: z.string(),
  invoiceId: z.string(),
  userId: z.string(),
  amount: z.number(),
  currency: z.string(),
  occurredAt: z.string().datetime(),
});
export type InvoiceGeneratedEvent = z.infer<typeof InvoiceGeneratedEventSchema>;
