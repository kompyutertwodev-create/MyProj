import { LogLevel } from '../LogLevel.js';
import type { LogEntry } from '../LogEntry.js';

const levelNames: Record<LogLevel, string> = {
  [LogLevel.Debug]: 'DEBUG',
  [LogLevel.Info]: 'INFO',
  [LogLevel.Warn]: 'WARN',
  [LogLevel.Error]: 'ERROR',
  [LogLevel.Fatal]: 'FATAL',
};

export class LogFormatter {
  toJSON(entry: LogEntry): string {
    return JSON.stringify({
      level: levelNames[entry.level],
      message: entry.message,
      timestamp: entry.timestamp.toISOString(),
      ...(entry.context ? { context: entry.context } : {}),
      ...(entry.error
        ? {
            error: {
              name: entry.error.name,
              message: entry.error.message,
              stack: entry.error.stack,
            },
          }
        : {}),
    });
  }

  toPretty(entry: LogEntry): string {
    const ts = entry.timestamp.toISOString();
    const level = levelNames[entry.level].padEnd(5);
    const ctx = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    const err = entry.error ? ` [${entry.error.name}: ${entry.error.message}]` : '';
    return `${ts} [${level}] ${entry.message}${ctx}${err}`;
  }
}
