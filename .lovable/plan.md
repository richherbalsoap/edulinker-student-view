

# Create Schools Table and Populate School Dropdown

## Problem
The Student Portal login shows an empty school dropdown because the `schools` table does not exist in the database. The frontend code already queries this table correctly.

## What's Already Done (No Changes Needed)
- `StudentAuthContext.tsx` already fetches from `schools` table and filters students by `school_id`
- `LoginPage.tsx` already renders the school dropdown and validates with `school_id + secret_id`
- All data pages already filter by `school_id`

## What Needs to Be Done

### Step 1: Create the `schools` table (Database Migration)
Create a new table with the following schema:
- `id` — uuid, primary key, default `gen_random_uuid()`
- `school_name` — text, not null
- `owner_user_id` — uuid, references `auth.users(id)`
- `created_at` — timestamp with time zone, default `now()`

Enable RLS on the table with a policy allowing public read access (students need to see the school list without being authenticated).

### Step 2: Add `school_id` column to related tables (if missing)
Check and add a `school_id` (uuid) foreign key column to:
- `students`
- `homework`
- `results`
- `complaints`
- `announcements`

Each should reference `schools(id)`.

### Step 3: Seed initial school data
For any existing admin users, insert a row into `schools` so the dropdown is populated. This can be done via a one-time SQL insert or through the Admin App's settings flow.

### Technical Notes
- No frontend changes are required in this Student Portal — all the code is already in place
- The Admin App (separate project) would need updates to:
  - Auto-create a school row on admin signup
  - Update `school_name` when display name changes in settings
  - Set `school_id` when creating students, homework, etc.
- Those Admin App changes are out of scope for this project

