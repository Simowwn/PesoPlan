import { Router } from 'express';
import { sql } from '../lib/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../utils/validation';
import { createIncomeSchema, updateIncomeSchema, getIncomeQuerySchema } from '../validators/income';
import { asyncHandler, NotFoundError, UnauthorizedError } from '../utils/errors';
import { sendSuccess } from '../utils/response';
import { schemas } from '../utils/validation';

const router = Router();

// All income routes require authentication
router.use(authenticate);

// GET /api/income - Get all income records
router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const query = validate(getIncomeQuerySchema, req.query);
  const userId = req.userId!;

  // Users can only see their own income
  const user_id = query.user_id || userId;
  
  if (user_id !== userId) {
    throw new UnauthorizedError('You can only access your own income');
  }

  const result = await sql`
    SELECT * FROM income 
    WHERE user_id = ${user_id}
    ORDER BY created_at DESC
  `;

  sendSuccess(res, result || []);
}));

// GET /api/income/:id - Get income by ID
router.get('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const id = validate(schemas.uuid, req.params.id);
  const userId = req.userId!;

  const result = await sql`
    SELECT * FROM income 
    WHERE id = ${id} AND user_id = ${userId}
  `;

  if (!result || result.length === 0) {
    throw new NotFoundError('Income');
  }

  sendSuccess(res, result[0]);
}));

// POST /api/income - Create a new income record
router.post('/', asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const data = validate(createIncomeSchema, { ...req.body, user_id: userId });

  const now = new Date().toISOString();
  const dateReceived = data.date_received || now;

  const result = await sql`
    INSERT INTO income (user_id, name, amount, source, date_received, created_at, updated_at)
    VALUES (${data.user_id}, ${data.name}, ${Number(data.amount)}, ${data.source}, ${dateReceived}, ${now}, ${now})
    RETURNING *
  `;

  sendSuccess(res, result[0], 201);
}));

// PUT /api/income/:id - Update income record
router.put('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const id = validate(schemas.uuid, req.params.id);
  const userId = req.userId!;
  const data = validate(updateIncomeSchema, req.body);
  const updatedAt = new Date().toISOString();

  // Get existing record and verify ownership
  const existing = await sql`
    SELECT * FROM income WHERE id = ${id} AND user_id = ${userId}
  `;

  if (!existing || existing.length === 0) {
    throw new NotFoundError('Income');
  }

  const result = await sql`
    UPDATE income 
    SET 
      name = ${data.name !== undefined ? data.name : existing[0].name},
      amount = ${data.amount !== undefined ? Number(data.amount) : existing[0].amount},
      source = ${data.source !== undefined ? data.source : existing[0].source},
      date_received = ${data.date_received !== undefined ? data.date_received : existing[0].date_received},
      updated_at = ${updatedAt}
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING *
  `;

  sendSuccess(res, result[0]);
}));

// DELETE /api/income/:id - Delete income record
router.delete('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const id = validate(schemas.uuid, req.params.id);
  const userId = req.userId!;

  const result = await sql`
    DELETE FROM income 
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id
  `;

  if (!result || result.length === 0) {
    throw new NotFoundError('Income');
  }

  res.status(204).send();
}));

export { router as incomeRoutes };

