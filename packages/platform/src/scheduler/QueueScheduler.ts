import type { Job, JobHandler } from './Job.js';
export class QueueScheduler {
  private readonly queue: Array<{ job: Job; handler: JobHandler }> = [];
  private running = false;
  async enqueue<T>(name: string, payload: T, handler: JobHandler<T>): Promise<Job<T>> {
    const job = {
      id: `${name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name,
      payload,
    };
    this.queue.push({ job, handler });
    void this.drain();
    return job;
  }
  start(): void {
    this.running = true;
    void this.drain();
  }
  async stop(): Promise<void> {
    this.running = false;
  }
  private async drain(): Promise<void> {
    if (!this.running) return;
    while (this.queue.length && this.running) {
      const item = this.queue.shift();
      if (item) await item.handler(item.job.payload);
    }
  }
}
