-- Simple fix for budget_plans table (keeps TEXT type for id)
-- Run this in Supabase SQL Editor: https://app.supabase.com > Your Project > SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add default for id column (generates UUID as TEXT)
-- Note: This uses gen_random_uuid() which returns UUID, then casts to TEXT
ALTER TABLE budget_plans 
ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- Add default for updated_at column
ALTER TABLE budget_plans 
ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

-- Create a trigger to auto-update updated_at on row updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if it exists, then create it
DROP TRIGGER IF EXISTS update_budget_plans_updated_at ON budget_plans;
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

