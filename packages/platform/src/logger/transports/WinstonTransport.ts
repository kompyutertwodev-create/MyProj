// TODO: Install the `winston` package to enable this transport.
// Run: npm install winston && npm install -D @types/winston
// Then replace this stub with a real implementation.
import type { LogEntry } from '../LogEntry.js';
import type { Transport } from './Transport.js';

export class WinstonTransport implements Transport {
  constructor(_options?: Record<string, unknown>) {
    console.warn(
      '[WinstonTransport] winston is not installed. This transport is a no-op. ' +
        'Add `winston` to your dependencies to enable it.'
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  write(_entry: LogEntry): void {
    // no-op: winston not installed
  }
}
