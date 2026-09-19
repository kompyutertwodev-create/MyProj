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

  /**
   * Map only public fields вЂ” passwords, sessions and RBAC data never leak.
   * Roles/permissions are queried separately through the AuthorizationPort
   * when the caller actually needs them.
   */
  static toPublicView(user: User): UserView {
    return {
      id: user.id.value,
      email: user.email.value,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      status: user.status,
      tenantId: user.tenantId,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}