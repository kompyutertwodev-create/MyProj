import type { CommandHandler } from './CommandHandler.js';
export interface CommandBus {
  register<C, R>(name: string, handler: CommandHandler<C, R>): void;
  execute<C, R>(name: string, command: C): Promise<R>;
}
