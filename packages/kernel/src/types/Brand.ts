/**
 * Nominal / branded type helper.
 * Prevents accidentally mixing two string IDs of different entity types.
 *
 * Example:
 *   type UserId   = Brand<string, "UserId">;
 *   type TenantId = Brand<string, "TenantId">;
 */
declare const __brand: unique symbol;
export type Brand<T, TBrand extends string> = T & { readonly [__brand]: TBrand };

export type Branded<T, TBrand extends string> = Brand<T, TBrand>;
