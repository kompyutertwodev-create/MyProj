import { z } from 'zod';

export const AwsSchema = z.object({
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  AWS_REGION: z.string().min(1).default('us-east-1'),
  S3_BUCKET: z.string().min(1),
});

export type AwsConfig = z.infer<typeof AwsSchema>;
