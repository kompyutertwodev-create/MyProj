export interface JwtSignOptions {
  expiresIn?: string | number;
  issuer?: string;
  audience?: string | string[];
  subject?: string;
}

export interface JwtService {
  sign(payload: Record<string, unknown>, options?: JwtSignOptions): Promise<string>;
  verify<T>(token: string): Promise<T>;
}
