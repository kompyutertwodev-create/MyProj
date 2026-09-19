/**
 * @workspace/access-control вЂ” public surface for the RBAC + ABAC module.
 *
 * The composition root (apps/api) needs:
 *   - the domain building blocks to construct/mutate aggregates
 *   - the application handlers to wire into HTTP routes
 *   - the infrastructure adapters (repositories, seeder, UoW) for DI
 *   - the HTTP router factory
 *
 * Everything else is internal.
 */

// Domain вЂ” aggregate roots, value objects, events, repository contracts
export * from './domain/index.js';

// Application вЂ” ports, commands, queries, services
export * from './application/index.js';

// Infrastructure вЂ” Drizzle/InMemory repositories, mappers, seed, UoW
export * from './infrastructure/index.js';

// Presentation вЂ” HTTP router factory + validators
export {
  createAccessControlRouter,
  type AccessControlRouterDependencies,
} from './presentation/index.js';