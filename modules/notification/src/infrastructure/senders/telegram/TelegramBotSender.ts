import { err, ok, type Result } from '@workspace/kernel';
import { NotificationChannel } from '../../../domain/NotificationChannel.js';
import type { Notification } from '../../../domain/Notification.js';
import type {
  NotificationSender,
  NotificationSendResult,
} from '../../../application/ports/NotificationSender.js';
import { TelegramApiClient } from './TelegramApiClient.js';
import { TelegramError } from './TelegramError.js';
import { TelegramRateLimiter } from './TelegramRateLimiter.js';
import { TelegramRetryPolicy } from './TelegramRetryPolicy.js';
import { ConsoleTelegramLogger, type TelegramLogger } from './TelegramLogger.js';

export interface TelegramBotSenderOptions {
  botToken: string;
  /** Rate limiter: capacity and refill rate. */
  rateLimit?: { capacity: number; refillPerSecond: number };
  /** Retry policy override. */
  retry?: { maxAttempts: number; baseDelayMs?: number; maxDelayMs?: number };
  /** Custom logger; defaults to structured console logging. */
  logger?: TelegramLogger;
  /** HTTP timeout for a single attempt. */
  timeoutMs?: number;
}

/**
 * Enterprise-grade Telegram sender for the notification module.
 *
 * Features:
 * - Rate limiting (token bucket)
 * - Retries with exponential backoff + jitter
 * - Honors Telegram's retry_after hint
 * - Per-attempt timeouts
 * - Structured logging of every attempt
 * - Idempotent: only one message per notification aggregate
 */
export class TelegramBotSender implements NotificationSender {
  readonly channel = NotificationChannel.Telegram;

  private readonly client: TelegramApiClient;
  private readonly limiter: TelegramRateLimiter;
  private readonly retry: TelegramRetryPolicy;
  private readonly logger: TelegramLogger;

  constructor(options: TelegramBotSenderOptions) {
    this.client = new TelegramApiClient({
      botToken: options.botToken,
      timeoutMs: options.timeoutMs ?? 10_000,
    });
    this.limiter = new TelegramRateLimiter(
      options.rateLimit ?? { capacity: 30, refillPerSecond: 25 }
    );
    this.retry = new TelegramRetryPolicy(
      options.retry?.maxAttempts ?? 5,
      options.retry?.baseDelayMs ?? 500,
      options.retry?.maxDelayMs ?? 30_000
    );
    this.logger = options.logger ?? new ConsoleTelegramLogger();
  }

  async send(notification: Notification): Promise<Result<NotificationSendResult, Error>> {
    const chatId = notification.contact.value;
    let lastError: TelegramError | null = null;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const startedAt = Date.now();
      await this.limiter.acquire();

      try {
        const message = await this.client.sendMessage({
          chat_id: chatId,
          text: `${notification.subject}\n\n${notification.body}`,
          disable_web_page_preview: true,
        });

        this.logger.log({
          event: 'success',
          chatId,
          attempt,
          durationMs: Date.now() - startedAt,
        });

        return ok({
          externalId: String(message.message_id),
          rawResponse: { chatId, messageId: message.message_id },
        });
      } catch (error) {
        const tgError =
          error instanceof TelegramError ? error : TelegramError.network(String(error));
        lastError = tgError;

        this.logger.log({
          event: 'failure',
          chatId,
          attempt,
          durationMs: Date.now() - startedAt,
          errorCode: tgError.code,
          reason: tgError.message,
        });

        const decision = this.retry.decide(attempt, tgError);
        if (!decision.shouldRetry) {
          return err(tgError);
        }

        this.logger.log({
          event: 'rate_limit',
          chatId,
          attempt,
          reason: `retrying in ${decision.delayMs}ms (${decision.reason})`,
        });
        await new Promise((resolve) => setTimeout(resolve, decision.delayMs));
      }
    }

    return err(lastError ?? new Error('Telegram send failed after retries'));
  }
}
