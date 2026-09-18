import { Redis } from 'ioredis';
import type { EventBus } from './EventBus.js';
import { InMemoryEventBus } from './MessageBus.js';
import { RedisEventBus } from './redis/RedisEventBus.js';

/**
 * Selects the platform transport at the composition boundary.
 * Redis is used when configured; local development remains dependency-free.
 */
export function createPlatformEventBus(): EventBus {
  const redisUrl = process.env['REDIS_URL'];
  if (!redisUrl) return new InMemoryEventBus();

  const publisher = new Redis(redisUrl);
  const subscriber = publisher.duplicate();
  return new RedisEventBus(publisher, subscriber, process.env['REDIS_EVENT_CHANNEL'] ?? 'events');
}
