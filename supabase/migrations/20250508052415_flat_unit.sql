/*
  # Fix badges RLS policies

  1. Changes
    - Drop existing RLS policies
    - Create new policies with proper access control
*/

-- Temporarily disable RLS
ALTER TABLE badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_badges DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read badges" ON badges;
DROP POLICY IF EXISTS "Allow authenticated users to insert badges" ON badges;
DROP POLICY IF EXISTS "Allow authenticated users to delete badges" ON badges;

DROP POLICY IF EXISTS "Allow authenticated users to read student_badges" ON student_badges;
DROP POLICY IF EXISTS "Allow authenticated users to insert student_badges" ON student_badges;
DROP POLICY IF EXISTS "Allow authenticated users to delete student_badges" ON student_badges;

-- Re-enable RLS
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_badges ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Enable read access for all users"
ON badges FOR SELECT
USING (true);

CREATE POLICY "Enable insert access for all users"
ON badges FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
ON badges FOR UPDATE
USING (true);

CREATE POLICY "Enable delete access for all users"
ON badges FOR DELETE
USING (true);

CREATE POLICY "Enable read access for all users"
ON student_badges FOR SELECT
USING (true);

CREATE POLICY "Enable insert access for all users"
ON student_badges FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
ON student_badges FOR UPDATE
USING (true);

CREATE POLICY "Enable delete access for all users"
ON student_badges FOR DELETE
USING (true);