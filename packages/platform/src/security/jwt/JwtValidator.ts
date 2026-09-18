export interface JwtClaims {
  exp?: number;
  iss?: string;
  aud?: string | string[];
  sub?: string;
  iat?: number;
  [key: string]: unknown;
}

export interface JwtValidationOptions {
  issuer?: string;
  audience?: string | string[];
  clockTolerance?: number;
}

export class JwtValidator {
  validate(claims: JwtClaims, options: JwtValidationOptions = {}): void {
    const now = Math.floor(Date.now() / 1000);
    const tolerance = options.clockTolerance ?? 0;

    if (claims.exp !== undefined && now > claims.exp + tolerance) {
      throw new Error('JWT has expired');
    }

    if (options.issuer !== undefined && claims.iss !== options.issuer) {
      throw new Error(`JWT issuer mismatch: expected ${options.issuer}, got ${claims.iss}`);
    }

    if (options.audience !== undefined) {
      const expectedAuds = Array.isArray(options.audience) ? options.audience : [options.audience];
      const claimAuds = Array.isArray(claims.aud) ? claims.aud : [claims.aud ?? ''];
      const hasAud = expectedAuds.some((a) => claimAuds.includes(a));
      if (!hasAud) {
        throw new Error('JWT audience mismatch');
      }
    }
  }
}
