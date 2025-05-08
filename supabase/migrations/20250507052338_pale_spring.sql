/*
  # Add order field to levels table

  1. Changes
    - Add `order` column to levels table
    - Set default order based on existing records
    - Add NOT NULL constraint
*/

-- Add order column
ALTER TABLE levels ADD COLUMN "order" integer;

-- Update existing records with sequential order
WITH ordered_levels AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
  FROM levels
)
UPDATE levels
SET "order" = ordered_levels.row_num
FROM ordered_levels
WHERE levels.id = ordered_levels.id;

-- Make order column NOT NULL
ALTER TABLE levels ALTER COLUMN "order" SET NOT NULL;