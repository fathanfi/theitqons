/*
  # Update students table structure

  1. Changes:
    - Remove teacher column
    - Add class_id and level_id as foreign keys
    - Add parent information columns
      - father_name
      - mother_name
      - wali_name
      - school_info
*/

-- First, create classes and levels tables if they don't exist
CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add new columns to students table
ALTER TABLE students
ADD COLUMN class_id uuid REFERENCES classes(id),
ADD COLUMN level_id uuid REFERENCES levels(id),
ADD COLUMN father_name text,
ADD COLUMN mother_name text,
ADD COLUMN wali_name text,
ADD COLUMN school_info text;

-- Migrate existing data
UPDATE students s
SET 
  class_id = (SELECT id FROM classes WHERE name = s.class),
  level_id = (SELECT id FROM levels WHERE name = s.level);

-- Make the new columns NOT NULL after data migration
ALTER TABLE students
ALTER COLUMN class_id SET NOT NULL,
ALTER COLUMN level_id SET NOT NULL;

-- Remove old columns
ALTER TABLE students
DROP COLUMN teacher,
DROP COLUMN class,
DROP COLUMN level;

-- Enable RLS on new tables
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE levels ENABLE ROW LEVEL SECURITY;

-- Create policies for new tables
CREATE POLICY "Allow authenticated users to read classes"
  ON classes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert classes"
  ON classes FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update classes"
  ON classes FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete classes"
  ON classes FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read levels"
  ON levels FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert levels"
  ON levels FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update levels"
  ON levels FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete levels"
  ON levels FOR DELETE TO authenticated USING (true); 