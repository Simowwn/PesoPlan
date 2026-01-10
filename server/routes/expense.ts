import { Router } from 'express';
import { db } from '../lib/db';
import { expensesTable } from '../lib/schema';
import { eq, and, desc } from 'drizzle-orm';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../utils/validation';
import { createExpenseSchema, updateExpenseSchema, getExpensesQuerySchema } from '../validators/expense';
import { asyncHandler, NotFoundError, UnauthorizedError } from '../utils/errors';
import { sendSuccess } from '../utils/response';
import { schemas } from '../utils/validation';

const router = Router();

// All expense routes require authentication
router.use(authenticate);

// GET /api/expenses - Get all expense records
router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const query = validate(getExpensesQuerySchema, req.query);
  const userId = req.userId!;

  // Users can only see their own expenses
  const user_id = query.user_id || userId;
  
  if (user_id !== userId) {
    throw new UnauthorizedError('You can only access your own expenses');
  }

  const conditions = [eq(expensesTable.userId, user_id)];
  if (query.category) {
    conditions.push(eq(expensesTable.category, query.category));
  }

  const result = await db
    .select()
    .from(expensesTable)
    .where(and(...conditions))
    .orderBy(desc(expensesTable.createdAt));

  sendSuccess(res, result || []);
}));

// GET /api/expenses/:id - Get expense by ID
router.get('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const id = validate(schemas.uuid, req.params.id);
  const userId = req.userId!;

  const result = await db
    .select()
    .from(expensesTable)
    .where(and(eq(expensesTable.id, id), eq(expensesTable.userId, userId)));

  if (!result || result.length === 0) {
    throw new NotFoundError('Expense');
  }

  sendSuccess(res, result[0]);
}));

// POST /api/expenses - Create a new expense record
router.post('/', asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const data = validate(createExpenseSchema, { ...req.body, user_id: userId });

  const result = await db
    .insert(expensesTable)
    .values({
      userId: data.user_id,
      name: data.name,
      amount: data.amount,
      category: data.category,
      subcategory: data.subcategory,
      isRecurring: Boolean(data.is_recurring),
      recurringInterval: data.is_recurring && data.recurring_interval ? data.recurring_interval : null,
      nextDueDate: data.is_recurring && data.next_due_date ? data.next_due_date : null,
    })
    .returning();

  sendSuccess(res, result[0], 201);
}));

// PUT /api/expenses/:id - Update expense record
router.put('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const id = validate(schemas.uuid, req.params.id);
  const userId = req.userId!;
  const data = validate(updateExpenseSchema, req.body);
  
  const existingResult = await db
    .select()
    .from(expensesTable)
    .where(and(eq(expensesTable.id, id), eq(expensesTable.userId, userId)));
    
  if (!existingResult || existingResult.length === 0) {
    throw new NotFoundError('Expense');
  }
  const existing = existingResult[0];

  const result = await db
    .update(expensesTable)
    .set({
      name: data.name !== undefined ? data.name : existing.name,
      amount: data.amount !== undefined ? data.amount : existing.amount,
      category: data.category !== undefined ? data.category : existing.category,
      subcategory: data.subcategory !== undefined ? data.subcategory : existing.subcategory,
      isRecurring: data.is_recurring !== undefined ? Boolean(data.is_recurring) : existing.isRecurring,
      recurringInterval: data.recurring_interval !== undefined ? data.recurring_interval : existing.recurringInterval,
      nextDueDate: data.next_due_date !== undefined ? data.next_due_date : existing.nextDueDate,
      updatedAt: new Date(),
    })
    .where(and(eq(expensesTable.id, id), eq(expensesTable.userId, userId)))
    .returning();

  sendSuccess(res, result[0]);
}));

// DELETE /api/expenses/:id - Delete expense record
router.delete('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const id = validate(schemas.uuid, req.params.id);
  const userId = req.userId!;

  const result = await db
    .delete(expensesTable)
    .where(and(eq(expensesTable.id, id), eq(expensesTable.userId, userId)))
    .returning({ id: expensesTable.id });

  if (!result || result.length === 0) {
    throw new NotFoundError('Expense');
  }

  res.status(204).send();
}));

export { router as expenseRoutes };