

# Fix: Auto-Sync Admin Display Name to School Dropdown

## Summary
The Student Portal frontend already correctly reads `school_name` from the `schools` table. The only fix needed is a **database trigger** that keeps `schools.school_name` in sync whenever an admin updates their Display Name. No frontend code changes are required.

## What's Wrong
The `sync_school_name` trigger previously created may not be working correctly, or may not have been applied. The `schools` table currently contains email addresses instead of display names for some rows.

## Solution: Database-Only Fix (Run in Supabase SQL Editor)

Run the following SQL in your **Supabase Dashboard > SQL Editor** as a single block:

```sql
-- 1. Ensure unique constraint exists for upsert
ALTER TABLE public.schools
  DROP CONSTRAINT IF EXISTS schools_owner_user_id_key;
ALTER TABLE public.schools
  ADD CONSTRAINT schools_owner_user_id_key UNIQUE (owner_user_id);

-- 2. Drop old trigger/function if exists
DROP TRIGGER IF EXISTS on_user_update_sync_school ON auth.users;
DROP FUNCTION IF EXISTS public.sync_school_name();

-- 3. Create the sync function (handles both INSERT and UPDATE on auth.users)
CREATE OR REPLACE FUNCTION public.sync_school_name()
RETURNS TRIGGER AS $$
DECLARE
  display text;
BEGIN
  display := NEW.raw_user_meta_data->>'display_name';
  IF display IS NOT NULL AND display != '' THEN
    INSERT INTO public.schools (school_name, owner_user_id)
    VALUES (display, NEW.id)
    ON CONFLICT (owner_user_id)
    DO UPDATE SET school_name = EXCLUDED.school_name;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger on INSERT and UPDATE of auth.users
CREATE TRIGGER on_user_sync_school
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_school_name();

-- 5. Fix existing rows: replace email fallbacks with actual display_name
UPDATE public.schools s
SET school_name = u.raw_user_meta_data->>'display_name'
FROM auth.users u
WHERE s.owner_user_id = u.id
  AND u.raw_user_meta_data->>'display_name' IS NOT NULL
  AND u.raw_user_meta_data->>'display_name' != '';
```

## What This Does

1. **Unique constraint** on `owner_user_id` -- enables upsert (INSERT ... ON CONFLICT)
2. **Trigger function** `sync_school_name()` -- extracts `display_name` from user metadata and upserts into `schools`
3. **Trigger fires on both INSERT and UPDATE** of `auth.users` -- covers new signups and display name changes
4. **Data cleanup** -- immediately fixes any existing rows that show emails instead of display names

## How It Works End-to-End

1. Admin changes Display Name in Settings -- updates `auth.users.raw_user_meta_data.display_name`
2. The UPDATE on `auth.users` fires the trigger
3. Trigger upserts `schools.school_name` with the new display name
4. Student Portal dropdown fetches `school_name` from `schools` table -- shows updated name

## No Frontend Changes
- `StudentAuthContext.tsx` already queries `schools.school_name`
- `LoginPage.tsx` already renders `s.school_name` in the dropdown
- No email fallback exists in the frontend code
