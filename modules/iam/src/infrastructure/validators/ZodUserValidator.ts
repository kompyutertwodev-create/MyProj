import { z } from 'zod';
import type { User } from '../../domain/User.js';
import type { UserView } from '../../application/queries/UserView.js';

export const CreateUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().trim().min(1).max(100),
});

export const UpdateUserInputSchema = z.object({
  displayName: z.string().trim().min(1).max(100).optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>;

export class ZodUserValidator {
  static validateCreate(input: unknown): CreateUserInput {
    return CreateUserInputSchema.parse(input);
  }

  static validateUpdate(input: unknown): UpdateUserInput {
    return UpdateUserInputSchema.parse(input);
  }

  /** Explicitly maps only public fields; passwords and domain internals never leak. */
  static toPublicView(user: User): UserView {
    return {
      id: user.id.value,
      email: user.email.value,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      status: user.status,
      roles: user.roles.map((role) => role.name.value),
      permissions: [...new Set(user.roles.flatMap((role) => role.permissions.map((p) => p.name)))],
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
