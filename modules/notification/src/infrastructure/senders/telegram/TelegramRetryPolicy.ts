import type { TelegramError } from './TelegramError.js';

export interface RetryDecision {
  shouldRetry: boolean;
  delayMs: number;
  reason: string;
}

/**
 * Exponential backoff with jitter, honoring Telegram's retry_after hint.
 *
 * Formula: min(base * 2^attempt, maxDelay) + jitter
 * If the error carries retryAfterMs, we use that instead.
 */
export class TelegramRetryPolicy {
  constructor(
    private readonly maxAttempts: number = 5,
    private readonly baseDelayMs: number = 500,
    private readonly maxDelayMs: number = 30_000,
    private readonly jitterMs: number = 250
  ) {}

  decide(attempt: number, error: TelegramError): RetryDecision {
    if (!error.retryable) {
      return { shouldRetry: false, delayMs: 0, reason: 'error is not retryable' };
    }
    if (attempt >= this.maxAttempts) {
      return { shouldRetry: false, delayMs: 0, reason: 'max attempts reached' };
    }

    // Telegram-specified retry_after takes precedence.
    if (error.retryAfterMs !== null) {
      return {
        shouldRetry: true,
        delayMs: error.retryAfterMs,
        reason: 'telegram retry_after',
      };
    }

    const backoff = Math.min(this.baseDelayMs * 2 ** attempt, this.maxDelayMs);
    const jitter = Math.floor(Math.random() * this.jitterMs);
    return {
      shouldRetry: true,
      delayMs: backoff + jitter,
      reason: 'exponential backoff',
    };
  }
}
