import type { Redis } from 'ioredis';
import type { CommandBus } from '../CommandBus.js';
import type { CommandHandler } from '../CommandHandler.js';
export class RedisCommandBus implements CommandBus {
  private readonly handlers = new Map<string, CommandHandler>();
  constructor(private readonly client?: Redis) {}
  register<C, R>(name: string, handler: CommandHandler<C, R>): void {
    this.handlers.set(name, handler as CommandHandler);
  }
  async execute<C, R>(name: string, command: C): Promise<R> {
    if (!this.client) {
      const h = this.handlers.get(name);
      if (!h) throw new Error(`No command handler registered: ${name}`);
      return h.handle(command) as Promise<R>;
    }
    const h = this.handlers.get(name);
    if (!h) throw new Error(`No command handler registered: ${name}`);
    return h.handle(command) as Promise<R>;
  }
}
