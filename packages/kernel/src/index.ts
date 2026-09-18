// ─── Domain Building Blocks ────────────────────────────────────────────────
export { Entity } from './domain/Entity.js';
export { AggregateRoot } from './domain/AggregateRoot.js';
export { ValueObject } from './domain/ValueObject.js';
export type { DomainEvent } from './domain/DomainEvent.js';
export { UniqueId } from './domain/UniqueId.js';
export { DomainError } from './domain/DomainError.js';
export { CompositeSpecification } from './domain/Specification.js';
export type { Specification } from './domain/Specification.js';
export type { Repository } from './domain/Repository.js';
export type { DomainService } from './domain/DomainService.js';
export type { UnitOfWork } from './domain/UnitOfWork.js';

// ─── Result Monad ──────────────────────────────────────────────────────────
export { Ok, Err, ok, err, combine } from './result/Result.js';
export type { Result } from './result/Result.js';
export { ErrorCode } from './result/Error.js';

// ─── Types ─────────────────────────────────────────────────────────────────
export type { Brand, Branded } from './types/Brand.js';
export type { Primitive } from './types/Primitive.js';
export type { Nullable, Optional, Maybe } from './types/Nullable.js';
export type { JsonValue, JsonObject, JsonArray, JsonPrimitive } from './types/JsonValue.js';
export type { DeepReadonly } from './types/DeepReadonly.js';
export type { MaybePromise } from './types/MaybePromise.js';
export type { AsyncResult } from './types/AsyncResult.js';
export type { PaginatedResult, PaginationParams } from './types/Paginated.js';
export type { SortOrder, SortParams } from './types/SortOrder.js';
export { paginate } from './types/Paginated.js';

// ─── Guards ────────────────────────────────────────────────────────────────
export { isPrimitive } from './guards/isPrimitive.js';
export { isJsonValue } from './guards/isJsonValue.js';
export { isNull, isUndefined, isNullable, isDefined } from './guards/isNullable.js';
export { isOk, isErr } from './guards/isResult.js';

// ─── Utils ─────────────────────────────────────────────────────────────────
export { assert } from './utils/assert.js';
export { invariant } from './utils/invariant.js';
export { identity, noop, sleep } from './utils/identity.js';
