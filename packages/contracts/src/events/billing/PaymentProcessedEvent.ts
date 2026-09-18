import { z } from 'zod';

export const PaymentProcessedEventSchema = z.object({
  eventId: z.string(),
  paymentId: z.string(),
  userId: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.enum(['succeeded', 'failed', 'refunded']),
  occurredAt: z.string().datetime(),
});
export type PaymentProcessedEvent = z.infer<typeof PaymentProcessedEventSchema>;
