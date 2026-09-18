export interface RabbitChannel {
  publish(
    exchange: string,
    routingKey: string,
    content: Buffer,
    options?: Record<string, unknown>
  ): boolean;
  consume(queue: string, handler: (message: { content: Buffer } | null) => void): Promise<unknown>;
  assertExchange?(name: string, type: string, options?: Record<string, unknown>): Promise<unknown>;
  assertQueue?(name: string, options?: Record<string, unknown>): Promise<unknown>;
  bindQueue?(queue: string, exchange: string, pattern: string): Promise<unknown>;
}
export interface RabbitConnection {
  createChannel(): Promise<RabbitChannel>;
  close?(): Promise<void>;
}
export class RabbitMQClient {
  constructor(private readonly connection: RabbitConnection) {}
  channel(): Promise<RabbitChannel> {
    return this.connection.createChannel();
  }
  close(): Promise<void> {
    return this.connection.close?.() ?? Promise.resolve();
  }
}
