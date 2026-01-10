# Database Migration Guide - Neon Postgres

This guide explains how to replace in-memory storage with Neon (Postgres) database in production.

## Step 1: Set Up Neon Database

1. **Create a Neon account**: Go to [neon.tech](https://neon.tech) and sign up
2. **Create a new project**: Create a new database project
3. **Get connection string**: Copy your connection string from the Neon dashboard
   - Format: `postgresql://user:password@host/database?sslmode=require`

## Step 2: Set Up Environment Variables

Create a `.env` file in the `server` directory (or use your deployment platform's environment variables):

```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
PORT=3001
```

**Important Security Notes:**
- Never commit `.env` files to version control
- Use environment variables in production (Vercel, Railway, etc.)
- Neon connection strings include credentials - keep them secure

## Step 3: Create Database Tables in Neon

Run these SQL commands in your Neon SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create income table
CREATE TABLE IF NOT EXISTS income (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  source TEXT NOT NULL,
  date_received TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('needs', 'wants')),
  subcategory TEXT NOT NULL CHECK (subcategory IN (
    'food', 'transportation', 'clothes', 'toys', 'gadgets',
    'travel', 'utilities', 'rent', 'entertainment', 'other'
  )),
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurring_interval TEXT CHECK (recurring_interval IN ('weekly', 'monthly', 'yearly')),
  next_due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create budget_plans table
CREATE TABLE IF NOT EXISTS budget_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  needs_percentage DECIMAL(5, 2) NOT NULL CHECK (needs_percentage >= 0 AND needs_percentage <= 100),
  wants_percentage DECIMAL(5, 2) NOT NULL CHECK (wants_percentage >= 0 AND wants_percentage <= 100),
  savings_percentage DECIMAL(5, 2) NOT NULL CHECK (savings_percentage >= 0 AND savings_percentage <= 100),
  active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_percentages_sum CHECK (
    ABS((needs_percentage + wants_percentage + savings_percentage) - 100) < 0.01
  )
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_income_user_id ON income(user_id);
CREATE INDEX IF NOT EXISTS idx_income_date_received ON income(date_received);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_budget_plans_user_id ON budget_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_plans_active ON budget_plans(user_id, active) WHERE active = true;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to auto-update updated_at
CREATE TRIGGER update_income_updated_at BEFORE UPDATE ON income
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_plans_updated_at BEFORE UPDATE ON budget_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Step 4: Update API Routes

The routes have been updated to use Neon Postgres. Key changes:

### Before (In-Memory):
```typescript
let incomes: Income[] = [];
incomes.push(newIncome);
const income = incomes.find(i => i.id === id);
```

### After (Neon Postgres):
```typescript
const result = await sql(
  'INSERT INTO income (user_id, name, amount, source) VALUES ($1, $2, $3, $4) RETURNING *',
  [user_id, name, amount, source]
);
```

## Step 5: Install Dependencies

```bash
npm install
```

This will install:
- `@neondatabase/serverless` - Neon's serverless Postgres client
- `drizzle-orm` - Optional ORM for type-safe queries

## Step 6: Test the Migration

1. Start the server: `npm run api:dev`
2. Test endpoints with Postman
3. Verify data persists in Neon dashboard
4. Check that queries execute correctly

## Differences from In-Memory Storage

1. **IDs**: Neon uses UUIDs (via `uuid_generate_v4()`) instead of timestamp strings
2. **Timestamps**: Database handles `created_at` and `updated_at` automatically via triggers
3. **Error Handling**: Postgres returns errors that need to be caught and handled
4. **Async Operations**: All database operations are async (use `await`)
5. **SQL Queries**: Direct SQL queries instead of query builder methods
6. **Parameterized Queries**: Use `$1, $2, $3` placeholders to prevent SQL injection

## Production Considerations

1. **Connection Pooling**: Neon handles connection pooling automatically
2. **Migrations**: Use Drizzle Kit or manual SQL migrations for schema changes
3. **Backups**: Neon provides automatic backups
4. **Monitoring**: Use Neon dashboard to monitor queries and performance
5. **Rate Limiting**: Consider adding rate limiting middleware
6. **Validation**: Add input validation (e.g., using Zod) before database operations
7. **Error Handling**: Implement proper error handling and logging
8. **SSL**: Neon requires SSL connections (included in connection string)

## Using Drizzle ORM (Optional)

If you want type-safe queries, you can use Drizzle ORM:

```typescript
import { db } from '../lib/db';
import { incomeTable } from '../lib/schema';

// Type-safe query
const result = await db.select().from(incomeTable).where(eq(incomeTable.userId, userId));
```

But raw SQL (as shown in the routes) works perfectly fine and is more straightforward.

## Troubleshooting

- **Connection errors**: Check your `DATABASE_URL` environment variable
- **SSL errors**: Ensure `?sslmode=require` is in your connection string
- **Timeout errors**: Neon has connection limits - consider connection pooling
- **Type errors**: Make sure your TypeScript types match your database schema
