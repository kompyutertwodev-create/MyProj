import { createHash } from 'node:crypto';

/**
 * SHA-256 hex digest of the input.
 *
 * Used to store refresh tokens and other secrets without keeping the
 * plaintext: callers hold the raw value, the database holds only the hash,
 * and lookups hash the input before comparing.
 *
 * Not a password hasher вЂ” see @workspace/platform for Argon2/Bcrypt. This
 * is deliberately fast because it must be usable on every request.
 */
export function sha256Hex(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}