/**
 * Categorizes Telegram API failures so callers can react appropriately.
 */
export class TelegramError extends Error {
  readonly code: number;
  readonly retryable: boolean;
  readonly retryAfterMs: number | null;

  constructor(message: string, options: {
    code: number;
    retryable: boolean;
    retryAfterMs?: number | null;
  }) {
    super(message);
    this.name = 'TelegramError';
    this.code = options.code;
    this.retryable = options.retryable;
    this.retryAfterMs = options.retryAfterMs ?? null;
  }

  static fromApiResponse(status: number, body: { error_code?: number; description?: string; parameters?: { retry_after?: number } }): TelegramError {
    const code = body.error_code ?? status;
    const description = body.description ?? `Telegram API error ${code}`;

    // 429 Too Many Requests — always retryable, with retry_after hint.
    if (code === 429) {
      const retryAfterSec = body.parameters?.retry_after ?? 1;
      return new TelegramError(description, {
        code,
        retryable: true,
        retryAfterMs: retryAfterSec * 1000,
      });
    }

    // 5xx — server-side, retryable.
    if (code >= 500) {
      return new TelegramError(description, { code, retryable: true });
    }

    // 4xx (except 429) — client error, not retryable.
    return new TelegramError(description, { code, retryable: false });
  }

  static network(message: string): TelegramError {
    return new TelegramError(message, { code: 0, retryable: true });
  }

  static timeout(timeoutMs: number): TelegramError {
    return new TelegramError(`Telegram API request timed out after ${timeoutMs}ms`, {
      code: 0,
      retryable: true,
    });
  }
}
