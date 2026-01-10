-- Sync Supabase Auth users to public.users table
-- Run this in Supabase SQL Editor: https://app.supabase.com > Your Project > SQL Editor

-- First, ensure password_hash column exists (nullable, since Supabase Auth handles passwords)
-- This won't fail if the column already exists
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Create a function to handle new user creation
-- This function is called automatically when a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- First, check if a user with this email already exists but with a different ID
  -- This can happen in edge cases during migration
  IF EXISTS (SELECT 1 FROM public.users WHERE email = NEW.email AND id != NEW.id) THEN
    -- Update foreign key references to use the correct auth.users ID
    UPDATE income SET user_id = NEW.id WHERE user_id IN (SELECT id FROM public.users WHERE email = NEW.email AND id != NEW.id);
    UPDATE expenses SET user_id = NEW.id WHERE user_id IN (SELECT id FROM public.users WHERE email = NEW.email AND id != NEW.id);
    UPDATE budget_plans SET user_id = NEW.id WHERE user_id IN (SELECT id FROM public.users WHERE email = NEW.email AND id != NEW.id);
    
    -- Delete the old user record(s) with the wrong ID
    DELETE FROM public.users WHERE email = NEW.email AND id != NEW.id;
  END IF;
  
  -- Insert or update the user record
  -- IMPORTANT: We MUST explicitly set the id to NEW.id from auth.users
  -- If we don't, PostgreSQL will use DEFAULT gen_random_uuid() which creates a different UUID
  -- This would cause foreign key mismatches and duplicate email errors
  INSERT INTO public.users (id, email, created_at)
  VALUES (
    NEW.id,  -- Explicitly use auth.users.id, NOT the default gen_random_uuid()
    NEW.email,
    COALESCE(NEW.created_at, NOW())
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger that fires when a new user is created in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- IMPORTANT: Handle the case where email exists in public.users but with a different ID
-- This happens because:
-- 1. The users.id column has DEFAULT gen_random_uuid()
-- 2. If a user was inserted without specifying an ID, PostgreSQL generated a random UUID
-- 3. This UUID is different from the auth.users.id (which comes from Supabase Auth)
-- 4. We need to update all foreign key references to use the correct auth.users ID
-- 5. Then delete the old user record with the wrong ID

-- Step 1: Find users with matching emails but different IDs
-- Update foreign key references to point to the correct auth.users ID
DO $$
DECLARE
  auth_user RECORD;
  public_user RECORD;
BEGIN
  -- For each auth user, check if there's a public user with the same email but different ID
  FOR auth_user IN SELECT id, email FROM auth.users LOOP
    SELECT id INTO public_user FROM public.users WHERE email = auth_user.email AND id != auth_user.id LIMIT 1;
    
    IF public_user IS NOT NULL THEN
      -- Update all foreign key references to use the auth.users ID
      UPDATE income SET user_id = auth_user.id WHERE user_id = public_user.id;
      UPDATE expenses SET user_id = auth_user.id WHERE user_id = public_user.id;
      UPDATE budget_plans SET user_id = auth_user.id WHERE user_id = public_user.id;
      
      -- Delete the old user record with the wrong ID
      DELETE FROM public.users WHERE id = public_user.id;
    END IF;
  END LOOP;
END $$;

-- Step 2: Sync existing auth users to the users table (if any exist)
-- This handles users who signed up before the trigger was created
-- Insert or update based on ID (the primary key)
INSERT INTO public.users (id, email, created_at)
SELECT 
  id,
  email,
  COALESCE(created_at, NOW())
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email;

-- Verify the trigger was created
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

