export interface RandomGenerator {
  uuid(): string;
  bytes(n: number): Buffer;
  token(n: number): string;
}
