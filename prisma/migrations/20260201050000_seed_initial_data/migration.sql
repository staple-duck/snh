-- Seed initial tree data
-- This migration populates the database with default data on first run only.
-- It checks if the table is empty before inserting, ensuring idempotency.

DO $$
DECLARE
  parent_uuid UUID;
BEGIN
  -- Check if table is empty (seed only on fresh database)
  IF NOT EXISTS (SELECT 1 FROM "TreeNode" LIMIT 1) THEN
    
    RAISE NOTICE '🌱 Creating initial seed data...';
    
    -- Create parent node
    parent_uuid := gen_random_uuid();
    INSERT INTO "TreeNode" (id, label, "parentId", "createdAt", "updatedAt")
    VALUES (parent_uuid, 'Parent', NULL, NOW(), NOW());
    
    -- Create child nodes
    INSERT INTO "TreeNode" (id, label, "parentId", "createdAt", "updatedAt")
    VALUES 
      (gen_random_uuid(), 'First', parent_uuid, NOW(), NOW()),
      (gen_random_uuid(), 'Second', parent_uuid, NOW(), NOW());
    
    RAISE NOTICE '✅ Initial seed completed: 1 parent + 2 children';
  ELSE
    RAISE NOTICE '⏭️  Table not empty - skipping seed';
  END IF;
END $$;
