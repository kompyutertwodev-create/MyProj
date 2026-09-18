import { Argon2Hasher } from '@workspace/platform';
import type { PasswordService } from '../../domain/domain-services/PasswordService.js';
import type { Result } from '@workspace/kernel';
import { DomainError, ok, err } from '@workspace/kernel';

/**
 * Legacy adapter name retained for compatibility.
 * Argon2id is used instead of bcrypt for new credentials.
 */
export class BcryptPasswordHasher implements PasswordService {
  private readonly hasher = new Argon2Hasher();

  hash(plain: string): Promise<string> {
    return this.hasher.hash(plain);
  }

  compare(plain: string, hash: string): Promise<boolean> {
    return this.hasher.compare(plain, hash);
  }

  validateStrength(plain: string): Result<true, DomainError> {
    if (plain.length < 8)
      return err(new DomainError('PASSWORD_WEAK', 'Password must be at least 8 characters'));
    if (!/[a-z]/.test(plain))
      return err(new DomainError('PASSWORD_WEAK', 'Password must contain a lowercase letter'));
    if (!/[A-Z]/.test(plain))
      return err(new DomainError('PASSWORD_WEAK', 'Password must contain an uppercase letter'));
    if (!/\d/.test(plain))
      return err(new DomainError('PASSWORD_WEAK', 'Password must contain a digit'));
    if (!/[^A-Za-z0-9]/.test(plain))
      return err(new DomainError('PASSWORD_WEAK', 'Password must contain a special character'));
    return ok(true);
  }
}
