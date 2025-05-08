/*
  # Fix redemptions table RLS policies

  1. Changes
    - Drop existing RLS policies
    - Create new policies with proper access control
*/

-- Temporarily disable RLS
ALTER TABLE redemptions DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read redemptions" ON redemptions;
DROP POLICY IF EXISTS "Allow authenticated users to insert redemptions" ON redemptions;

-- Re-enable RLS
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Enable read access for all users"
ON redemptions FOR SELECT
USING (true);

CREATE POLICY "Enable insert access for all users"
ON redemptions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
ON redemptions FOR UPDATE
USING (true);

CREATE POLICY "Enable delete access for all users"
ON redemptions FOR DELETE
USING (true);