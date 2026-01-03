import { Router } from 'express';
import { sql } from '../lib/db';
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

  const result = await sql`
    SELECT id, email, created_at FROM users 
    WHERE id = ${id}
  `;

  if (!result || result.length === 0) {
    throw new NotFoundError('User');
  }

  // Don't expose password_hash
  sendSuccess(res, { id: result[0].id, email: result[0].email, created_at: result[0].created_at });
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

  // Get existing user first
  const existing = await sql`
    SELECT * FROM users WHERE id = ${id}
  `;

  if (!existing || existing.length === 0) {
    throw new NotFoundError('User');
  }

  try {
    const result = await sql`
      UPDATE users 
      SET email = ${data.email}
      WHERE id = ${id}
      RETURNING id, email, created_at
    `;

    sendSuccess(res, result[0]);
  } catch (error: any) {
    if (error.code === '23505') {
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

  const result = await sql`
    DELETE FROM users 
    WHERE id = ${id}
    RETURNING id
  `;

  if (!result || result.length === 0) {
    throw new NotFoundError('User');
  }

  res.status(204).send();
}));

export { router as userRoutes };


