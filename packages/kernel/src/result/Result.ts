/**
 * Result<T, E> — a discriminated union representing success or failure.
 * Eliminates thrown exceptions for expected domain/application errors.
 *
 * Usage:
 *   const r: Result<User, DomainError> = ok(user);
 *   if (r.isOk()) { use(r.value); }
 */
export type Result<T, E extends Error = Error> = Ok<T, E> | Err<T, E>;

export class Ok<T, E extends Error = Error> {
  readonly _tag = 'Ok' as const;
  constructor(readonly value: T) {}

  isOk(): this is Ok<T, E> {
    return true;
  }
  isErr(): this is Err<T, E> {
    return false;
  }

  map<U>(fn: (v: T) => U): Result<U, E> {
    return ok(fn(this.value));
  }

  flatMap<U>(fn: (v: T) => Result<U, E>): Result<U, E> {
    return fn(this.value);
  }

  mapErr<F extends Error>(_fn: (e: E) => F): Result<T, F> {
    return ok(this.value);
  }

  getOrElse(_fallback: T): T {
    return this.value;
  }
  getOrThrow(): T {
    return this.value;
  }
  unwrapOr(_alt: T): T {
    return this.value;
  }
}

export class Err<T, E extends Error = Error> {
  readonly _tag = 'Err' as const;
  constructor(readonly error: E) {}

  isOk(): this is Ok<T, E> {
    return false;
  }
  isErr(): this is Err<T, E> {
    return true;
  }

  map<U>(_fn: (v: T) => U): Result<U, E> {
    return err(this.error);
  }

  flatMap<U>(_fn: (v: T) => Result<U, E>): Result<U, E> {
    return err(this.error);
  }

  mapErr<F extends Error>(fn: (e: E) => F): Result<T, F> {
    return err(fn(this.error));
  }

  getOrElse(fallback: T): T {
    return fallback;
  }

  getOrThrow(): never {
    throw this.error;
  }

  unwrapOr(alt: T): T {
    return alt;
  }
}

/** Create a successful result. */
export function ok<T, E extends Error = Error>(value: T): Result<T, E> {
  return new Ok(value);
}

/** Create a failed result. */
export function err<T, E extends Error = Error>(error: E): Result<T, E> {
  return new Err(error);
}

/** Combine multiple results — returns first error or array of all values. */
export function combine<T, E extends Error>(results: Result<T, E>[]): Result<T[], E> {
  const values: T[] = [];
  for (const r of results) {
    if (r.isErr()) return err(r.error);
    values.push(r.value);
  }
  return ok(values);
}
