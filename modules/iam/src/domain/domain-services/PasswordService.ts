import type { Result, DomainError } from '@workspace/kernel';

export interface PasswordService {
  hash(plain: string): Promise<string>;
  compare(plain: string, hash: string): Promise<boolean>;
  validateStrength(plain: string): Result<true, DomainError>;
}
