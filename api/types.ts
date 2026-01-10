// Re-export types from the main types file
export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Income {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  source: string;
  date_received: string;
  created_at: string;
  updated_at: string;
}

export type ExpenseSubcategory =
  | 'food'
  | 'transportation'
  | 'clothes'
  | 'toys'
  | 'gadgets'
  | 'travel'
  | 'utilities'
  | 'rent'
  | 'entertainment'
  | 'other';

export interface Expense {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  category: 'needs' | 'wants';
  subcategory: ExpenseSubcategory;
  is_recurring: boolean;
  recurring_interval?: 'weekly' | 'monthly' | 'yearly';
  next_due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface SavingsHistory {
  id: string;
  user_id: string;
  amount: number;
  type: 'investment' | 'savings' | 'insurance';
  computed_at: string;
}

export interface BudgetPlan {
  id: string;
  user_id: string;
  needs_percentage: number;
  wants_percentage: number;
  savings_percentage: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BudgetSummary {
  totalIncome: number;
  needsBudget: number;
  wantsBudget: number;
  savingsBudget: number;
  needsSpent: number;
  wantsSpent: number;
  needsRemaining: number;
  wantsRemaining: number;
}


