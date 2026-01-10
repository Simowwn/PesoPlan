-- Fix budget_plans table schema
-- Run this in Supabase SQL Editor: https://app.supabase.com > Your Project > SQL Editor

-- First, enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Alter the id column to have a default UUID generator
-- Note: This requires changing the column type from TEXT to UUID
-- If you have existing data, you'll need to migrate it first

-- Option A: If the table is empty or you can drop/recreate it
-- (SAFER - Check if table has data first)
DO $$
BEGIN
    -- Check if table has any rows
    IF (SELECT COUNT(*) FROM budget_plans) = 0 THEN
        -- Table is empty, safe to alter
        ALTER TABLE budget_plans 
        ALTER COLUMN id TYPE UUID USING gen_random_uuid(),
        ALTER COLUMN id SET DEFAULT gen_random_uuid(),
        ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;
        
        RAISE NOTICE 'Schema updated successfully';
    ELSE
        RAISE NOTICE 'Table has data. Use Option B migration instead.';
    END IF;
END $$;

-- Option B: If table has existing data (preserves data)
-- Step 1: Add a temporary UUID column
ALTER TABLE budget_plans ADD COLUMN id_new UUID DEFAULT gen_random_uuid();

-- Step 2: Copy existing IDs (if they're valid UUIDs) or generate new ones
-- If your existing IDs are already UUIDs in TEXT format:
UPDATE budget_plans SET id_new = id::UUID WHERE id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
-- For invalid UUIDs, they'll get new UUIDs from the default

-- Step 3: Drop the old column and rename the new one
ALTER TABLE budget_plans DROP COLUMN id;
ALTER TABLE budget_plans RENAME COLUMN id_new TO id;
ALTER TABLE budget_plans ALTER COLUMN id SET NOT NULL;
ALTER TABLE budget_plans ADD PRIMARY KEY (id);

-- Step 4: Fix updated_at default
ALTER TABLE budget_plans ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

-- Step 5: Create a trigger to auto-update updated_at on row updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_budget_plans_updated_at 
    BEFORE UPDATE ON budget_plans 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'budget_plans' 
ORDER BY ordinal_position;

