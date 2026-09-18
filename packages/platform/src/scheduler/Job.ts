export type JobHandler<T = unknown> = (payload: T, signal?: AbortSignal) => Promise<void> | void;
export interface Job<T = unknown> {
  id: string;
  name: string;
  payload: T;
  runAt?: Date;
  attempts?: number;
}
