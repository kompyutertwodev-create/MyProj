import { pgEnum } from 'drizzle-orm/pg-core';

export const deviceType = pgEnum('device_type', [
  'web',
  'mobile',
  'tablet',
  'tv',
  'desktop',
  'unknown',
]);
