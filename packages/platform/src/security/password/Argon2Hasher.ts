import argon2 from 'argon2';
import type { PasswordHasher } from './PasswordHasher.js';

export class Argon2Hasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    return argon2.hash(plain, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return argon2.verify(hash, plain);
  }
}
