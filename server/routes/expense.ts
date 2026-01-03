import { Router } from 'express';
import { sql } from '../lib/db';
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

  // Users can only see their own expenses unless they're admins (future feature)
  const user_id = query.user_id || userId;
  
  // Ensure users can only access their own data
  if (user_id !== userId) {
    throw new UnauthorizedError('You can only access your own expenses');
  }

  let result;
  if (query.category) {
    result = await sql`
      SELECT * FROM expenses 
      WHERE user_id = ${user_id} AND category = ${query.category}
      ORDER BY created_at DESC
    `;
  } else {
    result = await sql`
      SELECT * FROM expenses 
      WHERE user_id = ${user_id}
      ORDER BY created_at DESC
    `;
  }

  sendSuccess(res, result || []);
}));

// GET /api/expenses/:id - Get expense by ID
router.get('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const id = validate(schemas.uuid, req.params.id);
  const userId = req.userId!;

  const result = await sql`
    SELECT * FROM expenses 
    WHERE id = ${id} AND user_id = ${userId}
  `;

  if (!result || result.length === 0) {
    throw new NotFoundError('Expense');
  }

  sendSuccess(res, result[0]);
}));

// POST /api/expenses - Create a new expense record
router.post('/', asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const data = validate(createExpenseSchema, { ...req.body, user_id: userId });

  const now = new Date().toISOString();
  const result = await sql`
    INSERT INTO expenses (
      user_id, name, amount, category, subcategory, 
      is_recurring, recurring_interval, next_due_date, 
      created_at, updated_at
    )
    VALUES (
      ${data.user_id}, 
      ${data.name}, 
      ${Number(data.amount)}, 
      ${data.category}, 
      ${data.subcategory},
      ${Boolean(data.is_recurring)},
      ${data.is_recurring && data.recurring_interval ? data.recurring_interval : null},
      ${data.is_recurring && data.next_due_date ? data.next_due_date : null},
      ${now},
      ${now}
    )
    RETURNING *
  `;

  sendSuccess(res, result[0], 201);
}));

// PUT /api/expenses/:id - Update expense record
router.put('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const id = validate(schemas.uuid, req.params.id);
  const userId = req.userId!;
  const data = validate(updateExpenseSchema, req.body);
  const updatedAt = new Date().toISOString();

  // Get existing expense first and verify ownership
  const existing = await sql`
    SELECT * FROM expenses WHERE id = ${id} AND user_id = ${userId}
  `;

  if (!existing || existing.length === 0) {
    throw new NotFoundError('Expense');
  }

  const result = await sql`
    UPDATE expenses 
    SET 
      name = ${data.name !== undefined ? data.name : existing[0].name},
      amount = ${data.amount !== undefined ? Number(data.amount) : existing[0].amount},
      category = ${data.category !== undefined ? data.category : existing[0].category},
      subcategory = ${data.subcategory !== undefined ? data.subcategory : existing[0].subcategory},
      is_recurring = ${data.is_recurring !== undefined ? Boolean(data.is_recurring) : existing[0].is_recurring},
      recurring_interval = ${data.recurring_interval !== undefined ? data.recurring_interval : existing[0].recurring_interval},
      next_due_date = ${data.next_due_date !== undefined ? data.next_due_date : existing[0].next_due_date},
      updated_at = ${updatedAt}
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING *
  `;

  sendSuccess(res, result[0]);
}));

// DELETE /api/expenses/:id - Delete expense record
router.delete('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const id = validate(schemas.uuid, req.params.id);
  const userId = req.userId!;

  const result = await sql`
    DELETE FROM expenses 
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id
  `;

  if (!result || result.length === 0) {
    throw new NotFoundError('Expense');
  }

  res.status(204).send();
}));

export { router as expenseRoutes };


