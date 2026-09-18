import type { Job, JobHandler } from './Job.js';
export interface Scheduler {
  schedule<T>(name: string, payload: T, handler: JobHandler<T>, runAt?: Date): Promise<Job<T>>;
  cancel(id: string): Promise<boolean>;
  start(): void;
  stop(): Promise<void>;
}
