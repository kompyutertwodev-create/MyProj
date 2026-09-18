export class CacheKey {
  static build(...parts: string[]): string {
    return parts.filter(Boolean).join(':');
  }
}
