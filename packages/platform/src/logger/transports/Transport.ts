import type { LogEntry } from '../LogEntry.js';

export interface Transport {
  write(entry: LogEntry): void;
}
