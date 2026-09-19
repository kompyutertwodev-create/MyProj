/**
 * Simple token-bucket rate limiter for the Telegram Bot API.
 *
 * Telegram enforces ~30 messages per second per bot. We default to a
 * slightly lower rate to leave headroom for retries and other traffic.
 */
export class TelegramRateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number;
  private readonly refillPerMs: number;

  constructor(options: { capacity: number; refillPerSecond: number }) {
    this.capacity = options.capacity;
    this.tokens = options.capacity;
    this.refillPerMs = options.refillPerSecond / 1000;
    this.lastRefill = Date.now();
  }

  /**
   * Blocks until a token is available, then consumes it.
   */
  async acquire(): Promise<void> {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    const needed = 1 - this.tokens;
    const waitMs = Math.ceil(needed / this.refillPerMs);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    return this.acquire();
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const refilled = elapsed * this.refillPerMs;
    this.tokens = Math.min(this.capacity, this.tokens + refilled);
    this.lastRefill = now;
  }
}
