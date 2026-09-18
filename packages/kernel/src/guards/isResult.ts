import { Ok, Err, type Result } from '../result/Result.js';

export function isOk<T, E extends Error>(r: Result<T, E>): r is Ok<T, E> {
  return r instanceof Ok;
}

export function isErr<T, E extends Error>(r: Result<T, E>): r is Err<T, E> {
  return r instanceof Err;
}
