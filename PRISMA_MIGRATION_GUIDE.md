# Prisma Migration Guide - Convert IDs to UUID

This guide will help you convert all ID columns from TEXT to UUID and fix the database schema issues.

## Steps to Run Migration

### Step 1: Run the Prisma Migration

You have two options:

#### Option A: Using Prisma CLI (Recommended)

```bash
npx prisma migrate deploy
```

This will apply the migration `20260110191943_convert_ids_to_uuid` to your database.

#### Option B: Manual SQL Execution (If Prisma CLI doesn't work)

1. Go to **Supabase Dashboard** → Your Project → **SQL Editor**
2. Copy and paste the contents of `prisma/migrations/20260110191943_convert_ids_to_uuid/migration.sql`
3. Click **Run**

### Step 2: Sync Supabase Auth Users

After the migration, you need to set up the trigger to sync Supabase Auth users:

1. Go to **Supabase Dashboard** → Your Project → **SQL Editor**
2. Copy and paste the contents of `prisma/migrations/20260110191943_convert_ids_to_uuid/sync_auth_users.sql`
3. Click **Run**

This will:

- Create a trigger that automatically creates a user in `public.users` when someone signs up via Supabase Auth
- Sync any existing auth users to the `users` table

### Step 3: Verify Migration

Run this SQL to verify everything is correct:

```sql
-- Check column types
SELECT
    table_name,
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name IN ('users', 'income', 'expenses', 'budget_plans')
  AND column_name IN ('id', 'user_id', 'updated_at')
ORDER BY table_name, column_name;

-- Check if triggers exist
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%updated_at%' OR trigger_name = 'on_auth_user_created';
```

## What This Migration Does

1. **Converts all ID columns from TEXT to UUID**

   - `users.id`
   - `income.id` and `income.user_id`
   - `expenses.id` and `expenses.user_id`
   - `budget_plans.id` and `budget_plans.user_id`

2. **Adds default values**

   - All `id` columns: `DEFAULT gen_random_uuid()`
   - All `updated_at` columns: `DEFAULT CURRENT_TIMESTAMP`

3. **Creates auto-update triggers**

   - Automatically updates `updated_at` when rows are modified

4. **Syncs Supabase Auth users**
   - Creates trigger to automatically sync `auth.users` to `public.users`

## After Migration

- ✅ All IDs are now UUID type (standard PostgreSQL UUID)
- ✅ Database automatically generates UUIDs for new records
- ✅ `updated_at` is automatically managed
- ✅ Supabase Auth users are automatically synced to `public.users`
- ✅ No need to manually generate UUIDs or timestamps in code

## Troubleshooting

### If migration fails due to existing data:

The migration handles existing data by:

1. Converting valid UUID strings to UUID type
2. Generating new UUIDs for invalid strings
3. Preserving foreign key relationships

### If you get foreign key errors:

Make sure you've run the `sync_auth_users.sql` script to sync your current auth user to the `users` table.

### If Prisma schema is out of sync:

After running the migration, regenerate Prisma client:

```bash
npx prisma generate
```
