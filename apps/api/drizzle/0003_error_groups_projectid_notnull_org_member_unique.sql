-- Migration: make error_groups.project_id NOT NULL and add unique index on organization_members(organization_id, user_id)

-- Step 1: drop rows without a project (orphaned groups, if any) before applying the constraint
DELETE FROM error_groups WHERE project_id IS NULL;

-- Step 2: add NOT NULL constraint to error_groups.project_id
ALTER TABLE error_groups ALTER COLUMN project_id SET NOT NULL;

-- Step 3: add unique index on organization_members(organization_id, user_id) to prevent duplicate memberships
-- Remove any existing duplicates first (keep the earliest record)
DELETE FROM organization_members
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY organization_id, user_id ORDER BY created_at) AS rn
    FROM organization_members
  ) ranked
  WHERE rn > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS "org_member_unique" ON "organization_members" ("organization_id", "user_id");
