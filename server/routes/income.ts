import { Router } from 'express';
import { db } from '../lib/db';
import { incomeTable } from '../lib/schema';
import { eq, and, desc } from 'drizzle-orm';
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

  const result = await db
    .select()
    .from(incomeTable)
    .where(eq(incomeTable.userId, user_id))
    .orderBy(desc(incomeTable.createdAt));

  sendSuccess(res, result || []);
}));

// GET /api/income/:id - Get income by ID
router.get('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const id = validate(schemas.uuid, req.params.id);
  const userId = req.userId!;

  const result = await db
    .select()
    .from(incomeTable)
    .where(and(eq(incomeTable.id, id), eq(incomeTable.userId, userId)));

  if (!result || result.length === 0) {
    throw new NotFoundError('Income');
  }

  sendSuccess(res, result[0]);
}));

// POST /api/income - Create a new income record
router.post('/', asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const data = validate(createIncomeSchema, { ...req.body, user_id: userId });

  const result = await db
    .insert(incomeTable)
    .values({
      userId: data.user_id,
      name: data.name,
      amount: data.amount,
      source: data.source,
      dateReceived: data.date_received,
    })
    .returning();

  sendSuccess(res, result[0], 201);
}));

// PUT /api/income/:id - Update income record
router.put('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const id = validate(schemas.uuid, req.params.id);
  const userId = req.userId!;
  const data = validate(updateIncomeSchema, req.body);

  const existingResult = await db
    .select()
    .from(incomeTable)
    .where(and(eq(incomeTable.id, id), eq(incomeTable.userId, userId)));

  if (!existingResult || existingResult.length === 0) {
    throw new NotFoundError('Income');
  }
  const existing = existingResult[0];

  const result = await db
    .update(incomeTable)
    .set({
      name: data.name !== undefined ? data.name : existing.name,
      amount: data.amount !== undefined ? data.amount : existing.amount,
      source: data.source !== undefined ? data.source : existing.source,
      dateReceived: data.date_received !== undefined ? data.date_received : existing.dateReceived,
      updatedAt: new Date(),
    })
    .where(and(eq(incomeTable.id, id), eq(incomeTable.userId, userId)))
    .returning();

  sendSuccess(res, result[0]);
}));

// DELETE /api/income/:id - Delete income record
router.delete('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const id = validate(schemas.uuid, req.params.id);
  const userId = req.userId!;

  const result = await db
    .delete(incomeTable)
    .where(and(eq(incomeTable.id, id), eq(incomeTable.userId, userId)))
    .returning({ id: incomeTable.id });

  if (!result || result.length === 0) {
    throw new NotFoundError('Income');
  }

  res.status(204).send();
}));

export { router as incomeRoutes };
