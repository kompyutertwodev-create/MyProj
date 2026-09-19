import { z } from 'zod';

/**
 * Reusable UUID param schema.
 *
 * Kept as a factory rather than a constant because callers often need to
 * rename the parameter (`id`, `roleId`, `userId`, ...) for readability in
 * error messages.
 */
export function uuidParam(name = 'id') {
  return z.object({ [name]: z.string().uuid() });
}