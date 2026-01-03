import { Router } from 'express';
import { sql } from '../lib/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../utils/validation';
import { createBudgetPlanSchema, updateBudgetPlanSchema, getBudgetPlansQuerySchema } from '../validators/budgetPlan';
import { asyncHandler, NotFoundError, UnauthorizedError, ValidationError } from '../utils/errors';
import { sendSuccess } from '../utils/response';
import { schemas } from '../utils/validation';

const router = Router();

// All budget plan routes require authentication
router.use(authenticate);

// GET /api/budget-plans - Get all budget plans
router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const query = validate(getBudgetPlansQuerySchema, req.query);
  const userId = req.userId!;

  // Users can only see their own budget plans
  const user_id = query.user_id || userId;
  
  if (user_id !== userId) {
    throw new UnauthorizedError('You can only access your own budget plans');
  }

  // Transform active string to boolean
  const active = query.active === 'true' ? true : query.active === 'false' ? false : undefined;

  let result;
  if (active !== undefined) {
    result = await sql`
      SELECT * FROM budget_plans 
      WHERE user_id = ${user_id} AND active = ${active}
      ORDER BY created_at DESC
    `;
  } else {
    result = await sql`
      SELECT * FROM budget_plans 
      WHERE user_id = ${user_id}
      ORDER BY created_at DESC
    `;
  }

  sendSuccess(res, result || []);
}));

// GET /api/budget-plans/:id - Get budget plan by ID
router.get('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const id = validate(schemas.uuid, req.params.id);
  const userId = req.userId!;

  const result = await sql`
    SELECT * FROM budget_plans 
    WHERE id = ${id} AND user_id = ${userId}
  `;

  if (!result || result.length === 0) {
    throw new NotFoundError('Budget plan');
  }

  sendSuccess(res, result[0]);
}));

// POST /api/budget-plans - Create a new budget plan
router.post('/', asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const data = validate(createBudgetPlanSchema, { ...req.body, user_id: userId });

  // Deactivate other plans for the same user if this one is active
  if (data.active !== false) {
    await sql`
      UPDATE budget_plans 
      SET active = false 
      WHERE user_id = ${userId} AND active = true
    `;
  }

  const now = new Date().toISOString();
  const result = await sql`
    INSERT INTO budget_plans (
      user_id, needs_percentage, wants_percentage, savings_percentage, 
      active, created_at, updated_at
    )
    VALUES (
      ${data.user_id},
      ${Number(data.needs_percentage)},
      ${Number(data.wants_percentage)},
      ${Number(data.savings_percentage)},
      ${data.active !== false},
      ${now},
      ${now}
    )
    RETURNING *
  `;

  sendSuccess(res, result[0], 201);
}));

// PUT /api/budget-plans/:id - Update budget plan
router.put('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const id = validate(schemas.uuid, req.params.id);
  const userId = req.userId!;
  const data = validate(updateBudgetPlanSchema, req.body);

  // Get existing plan first and verify ownership
  const existing = await sql`
    SELECT * FROM budget_plans WHERE id = ${id} AND user_id = ${userId}
  `;

  if (!existing || existing.length === 0) {
    throw new NotFoundError('Budget plan');
  }

  // If percentages are being updated, validate they sum to 100
  if (
    data.needs_percentage !== undefined ||
    data.wants_percentage !== undefined ||
    data.savings_percentage !== undefined
  ) {
    const needs = data.needs_percentage !== undefined 
      ? Number(data.needs_percentage) 
      : Number(existing[0].needs_percentage);
    const wants = data.wants_percentage !== undefined 
      ? Number(data.wants_percentage) 
      : Number(existing[0].wants_percentage);
    const savings = data.savings_percentage !== undefined 
      ? Number(data.savings_percentage) 
      : Number(existing[0].savings_percentage);

    const total = needs + wants + savings;
    if (Math.abs(total - 100) > 0.01) {
      throw new ValidationError('Percentages must sum to 100');
    }
  }

  // If activating this plan, deactivate others for the same user
  if (data.active === true) {
    await sql`
      UPDATE budget_plans 
      SET active = false 
      WHERE user_id = ${userId} AND id != ${id} AND active = true
    `;
  }

  const updatedAt = new Date().toISOString();
  const result = await sql`
    UPDATE budget_plans 
    SET 
      needs_percentage = ${data.needs_percentage !== undefined ? Number(data.needs_percentage) : existing[0].needs_percentage},
      wants_percentage = ${data.wants_percentage !== undefined ? Number(data.wants_percentage) : existing[0].wants_percentage},
      savings_percentage = ${data.savings_percentage !== undefined ? Number(data.savings_percentage) : existing[0].savings_percentage},
      active = ${data.active !== undefined ? Boolean(data.active) : existing[0].active},
      updated_at = ${updatedAt}
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING *
  `;

  sendSuccess(res, result[0]);
}));

// DELETE /api/budget-plans/:id - Delete budget plan
router.delete('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const id = validate(schemas.uuid, req.params.id);
  const userId = req.userId!;

  const result = await sql`
    DELETE FROM budget_plans 
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id
  `;

  if (!result || result.length === 0) {
    throw new NotFoundError('Budget plan');
  }

  res.status(204).send();
}));

export { router as budgetPlanRoutes };


