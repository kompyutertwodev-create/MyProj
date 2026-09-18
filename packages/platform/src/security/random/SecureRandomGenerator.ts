import { randomBytes, randomUUID } from 'node:crypto';
import { createId } from '@paralleldrive/cuid2';
import type { RandomGenerator } from './RandomGenerator.js';

export class SecureRandomGenerator implements RandomGenerator {
  uuid(): string {
    return randomUUID();
  }

  cuid(): string {
    return createId();
  }

  bytes(n: number): Buffer {
    return randomBytes(n);
  }

  token(n: number): string {
    return randomBytes(n).toString('hex');
  }
}
