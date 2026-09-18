import type { QueryHandler } from './QueryHandler.js';
export interface QueryBus {
  register<Q, R>(name: string, handler: QueryHandler<Q, R>): void;
  execute<Q, R>(name: string, query: Q): Promise<R>;
}
