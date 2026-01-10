/**
 * Application constants
 */

export const EXPENSE_CATEGORIES = ['needs', 'wants'] as const;
export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

export const EXPENSE_SUBCATEGORIES = [
  'food',
  'transportation',
  'clothes',
  'toys',
  'gadgets',
  'travel',
  'utilities',
  'rent',
  'entertainment',
  'other',
] as const;

export type ExpenseSubcategory = typeof EXPENSE_SUBCATEGORIES[number];

export const RECURRING_INTERVALS = ['weekly', 'monthly', 'yearly'] as const;
export type RecurringInterval = typeof RECURRING_INTERVALS[number];

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 100;


