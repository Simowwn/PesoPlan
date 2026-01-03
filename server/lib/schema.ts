// Database schema definitions (optional, for Drizzle ORM)
// You can use this for type-safe queries, or use raw SQL

import { pgTable, uuid, text, decimal, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';

export const incomeTable = pgTable('income', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  source: text('source').notNull(),
  dateReceived: timestamp('date_received').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const expenseTable = pgTable('expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  category: text('category').notNull(), // 'needs' | 'wants'
  subcategory: text('subcategory').notNull(),
  isRecurring: boolean('is_recurring').notNull().default(false),
  recurringInterval: text('recurring_interval'), // 'weekly' | 'monthly' | 'yearly'
  nextDueDate: timestamp('next_due_date'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const budgetPlanTable = pgTable('budget_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  needsPercentage: decimal('needs_percentage', { precision: 5, scale: 2 }).notNull(),
  wantsPercentage: decimal('wants_percentage', { precision: 5, scale: 2 }).notNull(),
  savingsPercentage: decimal('savings_percentage', { precision: 5, scale: 2 }).notNull(),
  active: boolean('active').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const userTable = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});


