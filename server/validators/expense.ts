import { z } from 'zod';
import { schemas } from '../utils/validation';
import { EXPENSE_CATEGORIES as CATEGORIES, EXPENSE_SUBCATEGORIES as SUBCATEGORIES, RECURRING_INTERVALS as INTERVALS } from '../constants';

export const createExpenseSchema = z.object({
  user_id: schemas.uuid,
  name: schemas.nonEmptyString,
  amount: schemas.positiveNumber,
  category: z.enum(CATEGORIES, {
    errorMap: () => ({ message: 'Category must be "needs" or "wants"' }),
  }),
  subcategory: z.enum(SUBCATEGORIES, {
    errorMap: () => ({ message: 'Invalid subcategory' }),
  }),
  is_recurring: z.boolean().optional().default(false),
  recurring_interval: z.enum(INTERVALS).optional().nullable(),
  next_due_date: z.string().datetime().optional().nullable(),
});

export const updateExpenseSchema = createExpenseSchema.partial().omit({ user_id: true });

export const getExpensesQuerySchema = z.object({
  user_id: schemas.uuid.optional(),
  category: z.enum(CATEGORIES).optional(),
});

