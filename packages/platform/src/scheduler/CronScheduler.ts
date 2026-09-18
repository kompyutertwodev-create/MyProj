import type { JobHandler } from './Job.js';
import type { Scheduler } from './Scheduler.js';
import type { Job } from './Job.js';
interface Task {
  job: Job;
  handler: JobHandler;
  timer?: ReturnType<typeof setTimeout>;
  interval?: ReturnType<typeof setInterval>;
}
/** Lightweight interval scheduler. Cron expressions are intentionally not parsed; use scheduleInterval for deterministic jobs. */
export class CronScheduler implements Scheduler {
  private readonly tasks = new Map<string, Task>();
  private running = false;
  constructor(private readonly tickMs = 1000) {}
  schedule<T>(
    name: string,
    payload: T,
    handler: JobHandler<T>,
    runAt = new Date()
  ): Promise<Job<T>> {
    const job = {
      id: `${name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name,
      payload,
      runAt,
    };
    this.tasks.set(job.id, { job, handler });
    if (this.running) this.arm(job.id);
    return Promise.resolve(job);
  }
  scheduleInterval<T>(
    name: string,
    payload: T,
    handler: JobHandler<T>,
    intervalMs: number
  ): string {
    const id = `${name}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const job = { id, name, payload };
    const task: Task = { job, handler };
    this.tasks.set(id, task);
    if (this.running) task.interval = setInterval(() => void handler(payload), intervalMs);
    return id;
  }
  private arm(id: string): void {
    const task = this.tasks.get(id);
    if (!task) return;
    const delay = Math.max(0, (task.job.runAt?.getTime() ?? Date.now()) - Date.now());
    task.timer = setTimeout(async () => {
      if (this.tasks.has(id)) {
        await task.handler(task.job.payload);
        this.tasks.delete(id);
      }
    }, delay);
  }
  start(): void {
    this.running = true;
    for (const id of this.tasks.keys()) this.arm(id);
  }
  async stop(): Promise<void> {
    this.running = false;
    for (const t of this.tasks.values()) {
      if (t.timer) clearTimeout(t.timer);
      if (t.interval) clearInterval(t.interval);
    }
  }
  async cancel(id: string): Promise<boolean> {
    const t = this.tasks.get(id);
    if (!t) return false;
    if (t.timer) clearTimeout(t.timer);
    if (t.interval) clearInterval(t.interval);
    return this.tasks.delete(id);
  }
}
