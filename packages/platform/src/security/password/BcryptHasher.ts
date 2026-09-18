// Legacy name kept for backward compatibility.
// Uses argon2 under the hood with a lighter configuration.
import argon2 from 'argon2';
import type { PasswordHasher } from './PasswordHasher.js';

export class BcryptHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    return argon2.hash(plain, {
      type: argon2.argon2i,
      memoryCost: 4096,
      timeCost: 3,
      parallelism: 1,
    });
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return argon2.verify(hash, plain);
  }
}
