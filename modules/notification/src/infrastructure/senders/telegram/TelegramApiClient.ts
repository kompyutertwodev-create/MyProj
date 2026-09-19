import { TelegramError } from './TelegramError.js';
import type {
  SendMessageParams,
  TelegramApiResponse,
  TelegramMessage,
} from './TelegramTypes.js';

export interface TelegramApiClientOptions {
  botToken: string;
  baseUrl?: string;
  timeoutMs?: number;
}

/**
 * Thin wrapper around the Telegram Bot API.
 *
 * Responsibilities:
 * - URL construction
 * - JSON parsing
 * - Timeouts via AbortController
 * - Mapping HTTP/API errors to TelegramError
 *
 * Retries, rate limiting and logging are layered on top (TelegramBotSender).
 */
export class TelegramApiClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(private readonly options: TelegramApiClientOptions) {
    this.baseUrl = options.baseUrl ?? 'https://api.telegram.org';
    this.timeoutMs = options.timeoutMs ?? 10_000;
  }

  async sendMessage(params: SendMessageParams): Promise<TelegramMessage> {
    const url = `${this.baseUrl}/bot${this.options.botToken}/sendMessage`;
    return this.request<TelegramMessage>(url, params);
  }

  private async request<T>(url: string, body: unknown): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw TelegramError.timeout(this.timeoutMs);
      }
      throw TelegramError.network(error instanceof Error ? error.message : 'network error');
    } finally {
      clearTimeout(timer);
    }

    let parsed: TelegramApiResponse<T>;
    try {
      parsed = (await response.json()) as TelegramApiResponse<T>;
    } catch {
      throw TelegramError.fromApiResponse(response.status, {
        description: 'invalid JSON from Telegram API',
      });
    }

    if (!parsed.ok || parsed.result === undefined) {
      throw TelegramError.fromApiResponse(response.status, {
        error_code: parsed.error_code,
        description: parsed.description,
        parameters: parsed.parameters,
      });
    }

    return parsed.result;
  }
}
