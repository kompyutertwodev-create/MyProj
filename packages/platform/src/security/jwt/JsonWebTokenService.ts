import { SignJWT, jwtVerify } from 'jose';
import type { JWTPayload } from 'jose';
import type { JwtService, JwtSignOptions } from './JwtService.js';

function parseTTL(ttl: string | number): number {
  if (typeof ttl === 'number') return ttl;
  const match = /^(\d+)([smhd])$/.exec(ttl);
  if (!match) return 900;
  const [, num, unit] = match;
  const n = parseInt(num, 10);
  switch (unit) {
    case 's':
      return n;
    case 'm':
      return n * 60;
    case 'h':
      return n * 3600;
    case 'd':
      return n * 86400;
    default:
      return 900;
  }
}

export class JsonWebTokenService implements JwtService {
  private readonly secret: Uint8Array;
  private readonly algorithm: string;
  private readonly defaultIssuer?: string;
  private readonly defaultAudience?: string;

  constructor(options?: {
    secret?: string;
    algorithm?: string;
    issuer?: string;
    audience?: string;
  }) {
    const secret = options?.secret ?? process.env['JWT_SECRET'];
    if (!secret || secret.length < 16) {
      throw new Error('JWT_SECRET must be configured with at least 16 characters');
    }
    this.secret = new TextEncoder().encode(secret);
    this.algorithm = options?.algorithm ?? 'HS256';
    this.defaultIssuer = options?.issuer ?? process.env['JWT_ISSUER'];
    this.defaultAudience = options?.audience ?? process.env['JWT_AUDIENCE'];
  }

  async sign(payload: Record<string, unknown>, options?: JwtSignOptions): Promise<string> {
    const key = this.secret;
    let builder = new SignJWT(payload as JWTPayload).setProtectedHeader({
      alg: this.algorithm,
    });

    const issuer = options?.issuer ?? this.defaultIssuer;
    const audience = options?.audience ?? this.defaultAudience;

    if (issuer) builder = builder.setIssuer(issuer);
    if (audience) {
      builder = builder.setAudience(Array.isArray(audience) ? audience : [audience]);
    }
    if (options?.subject) builder = builder.setSubject(options.subject);

    builder = builder.setIssuedAt();

    const expiresIn = options?.expiresIn ?? process.env['JWT_ACCESS_TTL'] ?? '15m';
    builder = builder.setExpirationTime(
      typeof expiresIn === 'string' && /^\d+$/.test(expiresIn)
        ? `${expiresIn}s`
        : typeof expiresIn === 'number'
          ? `${expiresIn}s`
          : (expiresIn as string)
    );

    return builder.sign(key);
  }

  async verify<T>(token: string): Promise<T> {
    const key = this.secret;
    const verifyOptions: Record<string, unknown> = {
      algorithms: [this.algorithm],
    };
    if (this.defaultIssuer) verifyOptions['issuer'] = this.defaultIssuer;
    if (this.defaultAudience) verifyOptions['audience'] = [this.defaultAudience];

    const { payload } = await jwtVerify(token, key, verifyOptions);
    return payload as unknown as T;
  }
}

void parseTTL; // suppress unused warning — parseTTL is a utility kept for future use
