-- Row Level Security (RLS) Policies for PesoPlan
-- Run these SQL commands in your Supabase SQL Editor
-- Go to: https://app.supabase.com > Your Project > SQL Editor

-- Enable RLS on all tables
ALTER TABLE income ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_plans ENABLE ROW LEVEL SECURITY;

-- ============================================
-- INCOME TABLE POLICIES
-- ============================================

-- Policy: Users can view their own income
CREATE POLICY "Users can view own income"
ON income FOR SELECT
USING (auth.uid()::text = user_id::text);

-- Policy: Users can insert their own income
CREATE POLICY "Users can insert own income"
ON income FOR INSERT
WITH CHECK (auth.uid()::text = user_id::text);

-- Policy: Users can update their own income
CREATE POLICY "Users can update own income"
ON income FOR UPDATE
USING (auth.uid()::text = user_id::text)
WITH CHECK (auth.uid()::text = user_id::text);

-- Policy: Users can delete their own income
CREATE POLICY "Users can delete own income"
ON income FOR DELETE
USING (auth.uid()::text = user_id::text);

-- ============================================
-- EXPENSES TABLE POLICIES
-- ============================================

-- Policy: Users can view their own expenses
CREATE POLICY "Users can view own expenses"
ON expenses FOR SELECT
USING (auth.uid()::text = user_id::text);

-- Policy: Users can insert their own expenses
CREATE POLICY "Users can insert own expenses"
ON expenses FOR INSERT
WITH CHECK (auth.uid()::text = user_id::text);

-- Policy: Users can update their own expenses
CREATE POLICY "Users can update own expenses"
ON expenses FOR UPDATE
USING (auth.uid()::text = user_id::text)
WITH CHECK (auth.uid()::text = user_id::text);

-- Policy: Users can delete their own expenses
CREATE POLICY "Users can delete own expenses"
ON expenses FOR DELETE
USING (auth.uid()::text = user_id::text);

-- ============================================
-- BUDGET_PLANS TABLE POLICIES
-- ============================================

-- Policy: Users can view their own budget plans
CREATE POLICY "Users can view own budget plans"
ON budget_plans FOR SELECT
USING (auth.uid()::text = user_id::text);

-- Policy: Users can insert their own budget plans
CREATE POLICY "Users can insert own budget plans"
ON budget_plans FOR INSERT
WITH CHECK (auth.uid()::text = user_id::text);

-- Policy: Users can update their own budget plans
CREATE POLICY "Users can update own budget plans"
ON budget_plans FOR UPDATE
USING (auth.uid()::text = user_id::text)
WITH CHECK (auth.uid()::text = user_id::text);

-- Policy: Users can delete their own budget plans
CREATE POLICY "Users can delete own budget plans"
ON budget_plans FOR DELETE
USING (auth.uid()::text = user_id::text);

-- ============================================
-- VERIFY POLICIES
-- ============================================

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('income', 'expenses', 'budget_plans');

-- List all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('income', 'expenses', 'budget_plans')
ORDER BY tablename, policyname;

