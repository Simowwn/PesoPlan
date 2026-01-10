-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 1: Drop all RLS policies that depend on user_id columns
-- This must be done before we can drop/modify the columns
DROP POLICY IF EXISTS "Users can view own income" ON "income";
DROP POLICY IF EXISTS "Users can insert own income" ON "income";
DROP POLICY IF EXISTS "Users can update own income" ON "income";
DROP POLICY IF EXISTS "Users can delete own income" ON "income";

DROP POLICY IF EXISTS "Users can view own expenses" ON "expenses";
DROP POLICY IF EXISTS "Users can insert own expenses" ON "expenses";
DROP POLICY IF EXISTS "Users can update own expenses" ON "expenses";
DROP POLICY IF EXISTS "Users can delete own expenses" ON "expenses";

DROP POLICY IF EXISTS "Users can view own budget plans" ON "budget_plans";
DROP POLICY IF EXISTS "Users can insert own budget plans" ON "budget_plans";
DROP POLICY IF EXISTS "Users can update own budget plans" ON "budget_plans";
DROP POLICY IF EXISTS "Users can delete own budget plans" ON "budget_plans";

-- Step 2: Drop foreign key constraints temporarily
ALTER TABLE "income" DROP CONSTRAINT IF EXISTS "income_user_id_fkey";
ALTER TABLE "expenses" DROP CONSTRAINT IF EXISTS "expenses_user_id_fkey";
ALTER TABLE "budget_plans" DROP CONSTRAINT IF EXISTS "budget_plans_user_id_fkey";

-- Convert users table
-- Step 3: Add new UUID column
ALTER TABLE "users" ADD COLUMN "id_new" UUID DEFAULT gen_random_uuid();

-- Step 4: Convert existing TEXT IDs to UUID (if they're valid UUIDs)
UPDATE "users" SET "id_new" = "id"::UUID WHERE "id" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Step 4: Drop old id column and rename new one
ALTER TABLE "users" DROP CONSTRAINT "users_pkey";
ALTER TABLE "users" DROP COLUMN "id";
ALTER TABLE "users" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "users" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "users" ADD PRIMARY KEY ("id");

-- Convert income table
ALTER TABLE "income" ADD COLUMN "id_new" UUID DEFAULT gen_random_uuid();
ALTER TABLE "income" ADD COLUMN "user_id_new" UUID;

-- Update user_id references
UPDATE "income" i SET "user_id_new" = u."id" FROM "users" u WHERE i."user_id" = u."id"::TEXT;

-- Convert existing IDs
UPDATE "income" SET "id_new" = "id"::UUID WHERE "id" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

ALTER TABLE "income" DROP CONSTRAINT "income_pkey";
ALTER TABLE "income" DROP COLUMN "id";
ALTER TABLE "income" DROP COLUMN "user_id";
ALTER TABLE "income" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "income" RENAME COLUMN "user_id_new" TO "user_id";
ALTER TABLE "income" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "income" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "income" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "income" ADD PRIMARY KEY ("id");

-- Add default for updated_at
ALTER TABLE "income" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- Convert expenses table
ALTER TABLE "expenses" ADD COLUMN "id_new" UUID DEFAULT gen_random_uuid();
ALTER TABLE "expenses" ADD COLUMN "user_id_new" UUID;

-- Update user_id references
UPDATE "expenses" e SET "user_id_new" = u."id" FROM "users" u WHERE e."user_id" = u."id"::TEXT;

-- Convert existing IDs
UPDATE "expenses" SET "id_new" = "id"::UUID WHERE "id" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

ALTER TABLE "expenses" DROP CONSTRAINT "expenses_pkey";
ALTER TABLE "expenses" DROP COLUMN "id";
ALTER TABLE "expenses" DROP COLUMN "user_id";
ALTER TABLE "expenses" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "expenses" RENAME COLUMN "user_id_new" TO "user_id";
ALTER TABLE "expenses" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "expenses" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "expenses" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "expenses" ADD PRIMARY KEY ("id");

-- Add default for updated_at
ALTER TABLE "expenses" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- Convert budget_plans table
ALTER TABLE "budget_plans" ADD COLUMN "id_new" UUID DEFAULT gen_random_uuid();
ALTER TABLE "budget_plans" ADD COLUMN "user_id_new" UUID;

-- Update user_id references
UPDATE "budget_plans" b SET "user_id_new" = u."id" FROM "users" u WHERE b."user_id" = u."id"::TEXT;

-- Convert existing IDs
UPDATE "budget_plans" SET "id_new" = "id"::UUID WHERE "id" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

ALTER TABLE "budget_plans" DROP CONSTRAINT "budget_plans_pkey";
ALTER TABLE "budget_plans" DROP COLUMN "id";
ALTER TABLE "budget_plans" DROP COLUMN "user_id";
ALTER TABLE "budget_plans" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "budget_plans" RENAME COLUMN "user_id_new" TO "user_id";
ALTER TABLE "budget_plans" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "budget_plans" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "budget_plans" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "budget_plans" ADD PRIMARY KEY ("id");

-- Add default for updated_at
ALTER TABLE "budget_plans" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- Recreate foreign key constraints
ALTER TABLE "income" ADD CONSTRAINT "income_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "budget_plans" ADD CONSTRAINT "budget_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Recreate RLS policies with UUID-compatible comparisons
-- Note: auth.uid() returns UUID, so we compare directly without casting

-- INCOME TABLE POLICIES
CREATE POLICY "Users can view own income"
ON "income" FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own income"
ON "income" FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own income"
ON "income" FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own income"
ON "income" FOR DELETE
USING (auth.uid() = user_id);

-- EXPENSES TABLE POLICIES
CREATE POLICY "Users can view own expenses"
ON "expenses" FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses"
ON "expenses" FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
ON "expenses" FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses"
ON "expenses" FOR DELETE
USING (auth.uid() = user_id);

-- BUDGET_PLANS TABLE POLICIES
CREATE POLICY "Users can view own budget plans"
ON "budget_plans" FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budget plans"
ON "budget_plans" FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budget plans"
ON "budget_plans" FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own budget plans"
ON "budget_plans" FOR DELETE
USING (auth.uid() = user_id);

-- Create triggers to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_income_updated_at ON "income";
CREATE TRIGGER update_income_updated_at 
    BEFORE UPDATE ON "income" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_expenses_updated_at ON "expenses";
CREATE TRIGGER update_expenses_updated_at 
    BEFORE UPDATE ON "expenses" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_budget_plans_updated_at ON "budget_plans";
CREATE TRIGGER update_budget_plans_updated_at 
    BEFORE UPDATE ON "budget_plans" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

