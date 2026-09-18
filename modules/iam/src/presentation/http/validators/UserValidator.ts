import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';

export const UpdateUserRequestSchema = z.object({
  displayName: z.string().trim().min(1).max(100).optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

export function validateUserUpdate(req: Request, res: Response, next: NextFunction): void {
  const result = UpdateUserRequestSchema.safeParse(req.body);
  if (!result.success) {
    res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid user update',
        details: result.error.flatten().fieldErrors,
      },
    });
    return;
  }
  req.body = result.data;
  next();
}
