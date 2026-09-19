export interface TelegramLogEvent {
  event: 'attempt' | 'success' | 'failure' | 'rate_limit';
  chatId: string;
  attempt: number;
  durationMs?: number;
  errorCode?: number;
  reason?: string;
}

export interface TelegramLogger {
  log(event: TelegramLogEvent): void;
}

/**
 * Default logger: emits structured JSON to stdout, no external dependency.
 * Consumers can supply their own implementation (e.g. pino) via options.
 */
export class ConsoleTelegramLogger implements TelegramLogger {
  log(event: TelegramLogEvent): void {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ scope: 'telegram', ...event }));
  }
}

export class SilentTelegramLogger implements TelegramLogger {
  log(_event: TelegramLogEvent): void {
    // intentionally empty
  }
}
