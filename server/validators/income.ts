import { z } from 'zod';
import { schemas } from '../utils/validation';

export const createIncomeSchema = z.object({
  user_id: schemas.uuid,
  name: schemas.nonEmptyString,
  amount: schemas.positiveNumber,
  source: schemas.nonEmptyString,
  date_received: z.string().datetime().optional(),
});

export const updateIncomeSchema = createIncomeSchema.partial().omit({ user_id: true });

export const getIncomeQuerySchema = z.object({
  user_id: schemas.uuid.optional(),
});

