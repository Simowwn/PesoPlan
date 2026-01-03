import { z } from 'zod';
import { schemas } from '../utils/validation';

const percentageSchema = z
  .number()
  .min(0, 'Percentage cannot be negative')
  .max(100, 'Percentage cannot exceed 100');

export const createBudgetPlanSchema = z
  .object({
    user_id: schemas.uuid,
    needs_percentage: percentageSchema,
    wants_percentage: percentageSchema,
    savings_percentage: percentageSchema,
    active: z.boolean().optional().default(false),
  })
  .refine(
    (data) => {
      const total = data.needs_percentage + data.wants_percentage + data.savings_percentage;
      return Math.abs(total - 100) < 0.01;
    },
    {
      message: 'Percentages must sum to 100',
      path: ['percentages'],
    }
  );

export const updateBudgetPlanSchema = z
  .object({
    needs_percentage: percentageSchema.optional(),
    wants_percentage: percentageSchema.optional(),
    savings_percentage: percentageSchema.optional(),
    active: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // Only validate if at least one percentage is provided
      if (
        data.needs_percentage === undefined &&
        data.wants_percentage === undefined &&
        data.savings_percentage === undefined
      ) {
        return true;
      }
      // This will be validated in the route handler with existing values
      return true;
    },
    {
      message: 'Percentages must sum to 100',
    }
  );

export const getBudgetPlansQuerySchema = z.object({
  user_id: schemas.uuid.optional(),
  active: z.string().optional(),
});

