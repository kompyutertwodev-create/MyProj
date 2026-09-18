import type { DomainEvent } from '@workspace/kernel';
import type { EventHandler } from './EventHandler.js';
import type { CommandHandler } from './CommandHandler.js';
import type { QueryHandler } from './QueryHandler.js';
import type { MessageMiddleware } from './MessageMiddleware.js';
import type { EventBus } from './EventBus.js';
import type { CommandBus } from './CommandBus.js';
import type { QueryBus } from './QueryBus.js';

export interface MessageBus extends EventBus, CommandBus, QueryBus {
  use(middleware: MessageMiddleware): this;
}
export class InMemoryMessageBus implements MessageBus {
  private readonly events = new Map<string, Set<EventHandler>>();
  private readonly commands = new Map<string, CommandHandler>();
  private readonly queries = new Map<string, QueryHandler>();
  private readonly middleware: MessageMiddleware[] = [];
  use(middleware: MessageMiddleware): this {
    this.middleware.push(middleware);
    return this;
  }
  subscribe<T extends DomainEvent>(name: string, handler: EventHandler<T>): () => void {
    let set = this.events.get(name);
    if (!set) {
      set = new Set();
      this.events.set(name, set);
    }
    set.add(handler as EventHandler);
    return () => set?.delete(handler as EventHandler);
  }
  async publish(event: DomainEvent): Promise<void> {
    const handlers = [...(this.events.get(event.eventName) ?? [])];
    await Promise.all(handlers.map((handler) => this.dispatch(event, () => handler.handle(event))));
  }
  register<C, R>(name: string, handler: CommandHandler<C, R>): void {
    this.commands.set(name, handler as CommandHandler);
  }
  execute<C, R>(name: string, command: C): Promise<R> {
    const handler = this.commands.get(name) ?? this.queries.get(name);
    if (!handler) return Promise.reject(new Error(`No message handler registered: ${name}`));
    return this.dispatch(command, () => handler.handle(command)) as Promise<R>;
  }
  registerQuery<Q, R>(name: string, handler: QueryHandler<Q, R>): void {
    this.queries.set(name, handler as QueryHandler);
  }
  executeQuery<Q, R>(name: string, query: Q): Promise<R> {
    const handler = this.queries.get(name);
    if (!handler) return Promise.reject(new Error(`No query handler registered: ${name}`));
    return this.dispatch(query, () => handler.handle(query)) as Promise<R>;
  }
  // QueryBus uses execute; this overload allows command/query names to coexist.
  async dispatch<M, R>(message: M, terminal: () => Promise<R>): Promise<R> {
    let i = this.middleware.length - 1;
    const run = (): Promise<R> => (i < 0 ? terminal() : this.middleware[i--].handle(message, run));
    return run();
  }
}

export class InMemoryEventBus implements EventBus {
  private readonly bus = new InMemoryMessageBus();
  publish(event: DomainEvent): Promise<void> {
    return this.bus.publish(event);
  }
  subscribe<T extends DomainEvent>(name: string, handler: EventHandler<T>): () => void {
    return this.bus.subscribe(name, handler);
  }
}
export class InMemoryCommandBus implements CommandBus {
  private readonly bus = new InMemoryMessageBus();
  register<C, R>(name: string, handler: CommandHandler<C, R>): void {
    this.bus.register(name, handler);
  }
  execute<C, R>(name: string, command: C): Promise<R> {
    return this.bus.execute(name, command);
  }
}
export class InMemoryQueryBus implements QueryBus {
  private readonly bus = new InMemoryMessageBus();
  register<Q, R>(name: string, handler: QueryHandler<Q, R>): void {
    this.bus.registerQuery(name, handler);
  }
  execute<Q, R>(name: string, query: Q): Promise<R> {
    return this.bus.executeQuery(name, query);
  }
}
