import { Router } from 'express';
import { db } from '../lib/db';
import { userTable } from '../lib/schema';
import { eq } from 'drizzle-orm';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../utils/validation';
import { asyncHandler, NotFoundError, ConflictError, UnauthorizedError } from '../utils/errors';
import { sendSuccess } from '../utils/response';
import { schemas } from '../utils/validation';
import { z } from 'zod';

const router = Router();

const updateUserSchema = z.object({
  email: schemas.email,
});

// GET /api/users/:id - Get user by ID (public for verification, but limited info)
router.get('/:id', asyncHandler(async (req, res) => {
  const id = validate(schemas.uuid, req.params.id);

  const result = await db
    .select({
      id: userTable.id,
      email: userTable.email,
      createdAt: userTable.createdAt,
    })
    .from(userTable)
    .where(eq(userTable.id, id));

  if (!result || result.length === 0) {
    throw new NotFoundError('User');
  }

  sendSuccess(res, result[0]);
}));

// PUT /api/users/:id - Update user (requires authentication and ownership)
router.put('/:id', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const id = validate(schemas.uuid, req.params.id);
  const userId = req.userId!;
  const data = validate(updateUserSchema, req.body);

  // Users can only update their own profile
  if (id !== userId) {
    throw new UnauthorizedError('You can only update your own profile');
  }

  // Check if user exists
  const existing = await db.select({ id: userTable.id }).from(userTable).where(eq(userTable.id, id));
  if (!existing || existing.length === 0) {
    throw new NotFoundError('User');
  }

  try {
    const result = await db
      .update(userTable)
      .set({ email: data.email })
      .where(eq(userTable.id, id))
      .returning({
        id: userTable.id,
        email: userTable.email,
        createdAt: userTable.createdAt,
      });

    sendSuccess(res, result[0]);
  } catch (error: any) {
    if (error.code === '23505') { // Handle unique constraint violation for email
      throw new ConflictError('Email already exists');
    }
    throw error;
  }
}));

// DELETE /api/users/:id - Delete user (requires authentication and ownership)
router.delete('/:id', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const id = validate(schemas.uuid, req.params.id);
  const userId = req.userId!;

  // Users can only delete their own account
  if (id !== userId) {
    throw new UnauthorizedError('You can only delete your own account');
  }

  const result = await db
    .delete(userTable)
    .where(eq(userTable.id, id))
    .returning({ id: userTable.id });

  if (!result || result.length === 0) {
    throw new NotFoundError('User');
  }

  res.status(204).send();
}));

export { router as userRoutes };
