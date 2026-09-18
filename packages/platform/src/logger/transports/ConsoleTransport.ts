import { LogLevel } from '../LogLevel.js';
import { LogFormatter } from '../utils/LogFormatter.js';
import type { LogEntry } from '../LogEntry.js';
import type { Transport } from './Transport.js';

const formatter = new LogFormatter();

export class ConsoleTransport implements Transport {
  private readonly isDev: boolean;

  constructor(isDev?: boolean) {
    this.isDev = isDev ?? process.env['NODE_ENV'] !== 'production';
  }

  write(entry: LogEntry): void {
    const output = this.isDev ? formatter.toPretty(entry) : formatter.toJSON(entry);

    if (entry.level >= LogLevel.Error) {
      console.error(output);
    } else if (entry.level === LogLevel.Warn) {
      console.warn(output);
    } else {
      console.log(output);
    }
  }
}
