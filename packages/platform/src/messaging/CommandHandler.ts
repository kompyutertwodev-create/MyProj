export interface CommandHandler<C = unknown, R = unknown> {
  handle(command: C): Promise<R>;
}
