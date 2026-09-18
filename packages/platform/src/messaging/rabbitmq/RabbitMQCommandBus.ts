import type { CommandBus } from '../CommandBus.js';
import type { CommandHandler } from '../CommandHandler.js';
export class RabbitMQCommandBus implements CommandBus {
  private readonly handlers = new Map<string, CommandHandler>();
  register<C, R>(name: string, handler: CommandHandler<C, R>): void {
    this.handlers.set(name, handler as CommandHandler);
  }
  async execute<C, R>(name: string, command: C): Promise<R> {
    const handler = this.handlers.get(name);
    if (!handler) throw new Error(`No command handler registered: ${name}`);
    return handler.handle(command) as Promise<R>;
  }
}
