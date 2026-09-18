import { LogLevel } from './LogLevel.js';
import type { Logger } from './Logger.js';
import type { LogContext } from './LogContext.js';
import type { LogEntry } from './LogEntry.js';
import type { Transport } from './transports/Transport.js';
import { ConsoleTransport } from './transports/ConsoleTransport.js';

export interface LoggerOptions {
  level?: LogLevel;
  transports?: Transport[];
  defaultContext?: LogContext;
}

class DefaultLogger implements Logger {
  private readonly name: string;
  private readonly level: LogLevel;
  private readonly transports: Transport[];
  private readonly ctx: LogContext;

  constructor(name: string, options: LoggerOptions = {}, ctx: LogContext = {}) {
    this.name = name;
    this.level = options.level ?? LogLevel.Info;
    this.transports =
      options.transports && options.transports.length > 0
        ? options.transports
        : [new ConsoleTransport()];
    this.ctx = { ...options.defaultContext, ...ctx, module: ctx['module'] ?? name };
  }

  private emit(level: LogLevel, message: string, context?: LogContext): void {
    if (level < this.level) return;
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context: { ...this.ctx, ...context },
    };
    if (context?.['error'] instanceof Error) {
      entry.error = context['error'] as Error;
    }
    for (const transport of this.transports) {
      transport.write(entry);
    }
  }

  debug(message: string, context?: LogContext): void {
    this.emit(LogLevel.Debug, message, context);
  }
  info(message: string, context?: LogContext): void {
    this.emit(LogLevel.Info, message, context);
  }
  warn(message: string, context?: LogContext): void {
    this.emit(LogLevel.Warn, message, context);
  }
  error(message: string, context?: LogContext): void {
    this.emit(LogLevel.Error, message, context);
  }
  fatal(message: string, context?: LogContext): void {
    this.emit(LogLevel.Fatal, message, context);
  }

  child(context: LogContext): Logger {
    return new DefaultLogger(
      this.name,
      { level: this.level, transports: this.transports },
      { ...this.ctx, ...context }
    );
  }
}

export function createLogger(name: string, options?: LoggerOptions): Logger {
  return new DefaultLogger(name, options);
}
