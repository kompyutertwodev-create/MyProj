export type MessageNext<R> = () => Promise<R>;
export interface MessageMiddleware<M = unknown> {
  handle<R>(message: M, next: MessageNext<R>): Promise<R>;
}
