/** Identity function — returns its argument unchanged. Useful in fp pipelines. */
export function identity<T>(value: T): T {
  return value;
}

/** No-op function. */
export function noop(): void {}

/** Sleep for a given number of milliseconds. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
