import type { Result } from '../result/Result.js';
export type AsyncResult<T, E extends Error = Error> = Promise<Result<T, E>>;
