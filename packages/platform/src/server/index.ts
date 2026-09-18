// Reusable Express app-factory and middleware building blocks.
//
// apps/api is the composition root and currently wires Express directly
// (see apps/api/src/server.ts, middleware.ts). As shared HTTP concerns
// emerge across future apps, extract them here so apps/api composes them
// instead of re-implementing them.
export * from './express';
export * from './middleware';
