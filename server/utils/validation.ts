import { z } from 'zod';
import { ValidationError } from './errors';
import { EXPENSE_CATEGORIES, EXPENSE_SUBCATEGORIES, RECURRING_INTERVALS } from '../constants';

/**
 * Validate request body against a Zod schema
 */
export const validate = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    const fields: Record<string, string[]> = {};
    result.error.errors.forEach((err) => {
      const path = err.path.join('.');
      if (!fields[path]) {
        fields[path] = [];
      }
      fields[path].push(err.message);
    });
    
    throw new ValidationError('Validation failed', fields);
  }
  
  return result.data;
};

/**
 * Common validation schemas
 */
export const schemas = {
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password too long'),
  uuid: z.string().uuid('Invalid ID format'),
  positiveNumber: z.number().positive('Must be a positive number'),
  nonEmptyString: z.string().min(1, 'Cannot be empty'),
  date: z.string().datetime().or(z.date()),
  // Export constants for use in validators
  EXPENSE_CATEGORIES,
  EXPENSE_SUBCATEGORIES,
  RECURRING_INTERVALS,
};

