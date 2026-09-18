import { z } from 'zod';

export const KafkaSchema = z.object({
  KAFKA_BROKERS: z.string().min(1),
  KAFKA_GROUP_ID: z.string().min(1),
});

export type KafkaConfig = z.infer<typeof KafkaSchema>;
