import { randomBytes, randomUUID } from 'node:crypto';
import type { RandomGenerator } from '@workspace/platform';

export class SecureRandomGenerator implements RandomGenerator {
  uuid(): string {
    return randomUUID();
  }

  bytes(length: number): Buffer {
    return randomBytes(length);
  }

  token(length = 32): string {
    return randomBytes(length).toString('base64url');
  }
}
