import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { LogFormatter } from '../utils/LogFormatter.js';
import type { LogEntry } from '../LogEntry.js';
import type { Transport } from './Transport.js';

const formatter = new LogFormatter();

export class FileTransport implements Transport {
  private readonly filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
    mkdirSync(dirname(filePath), { recursive: true });
  }

  write(entry: LogEntry): void {
    appendFileSync(this.filePath, formatter.toJSON(entry) + '\n', 'utf8');
  }
}
