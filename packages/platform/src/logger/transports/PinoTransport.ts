import pino from 'pino';
import { LogLevel } from '../LogLevel.js';
import type { LogEntry } from '../LogEntry.js';
import type { Transport } from './Transport.js';

const levelMap: Record<LogLevel, string> = {
  [LogLevel.Debug]: 'debug',
  [LogLevel.Info]: 'info',
  [LogLevel.Warn]: 'warn',
  [LogLevel.Error]: 'error',
  [LogLevel.Fatal]: 'fatal',
};

export class PinoTransport implements Transport {
  private readonly logger: pino.Logger;

  constructor(options?: pino.LoggerOptions) {
    this.logger = pino(options ?? {});
  }

  write(entry: LogEntry): void {
    const method = levelMap[entry.level] as keyof pino.Logger;
    const ctx = {
      ...(entry.context ?? {}),
      ...(entry.error ? { err: entry.error } : {}),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.logger[method] as any)(ctx, entry.message);
  }
}
