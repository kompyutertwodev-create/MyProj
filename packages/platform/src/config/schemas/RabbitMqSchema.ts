import { z } from 'zod';

export const RabbitMqSchema = z.object({
  RABBITMQ_URL: z.string().url().default('amqp://localhost:5672'),
  RABBITMQ_EXCHANGE: z.string().min(1).default('events'),
});

export type RabbitMqConfig = z.infer<typeof RabbitMqSchema>;
