export interface QueryHandler<Q = unknown, R = unknown> {
  handle(query: Q): Promise<R>;
}
