/*
  # Fix RLS policies for academic years

  This migration:
  1. Disables RLS temporarily
  2. Drops existing policies
  3. Re-enables RLS with proper policies
*/

-- Temporarily disable RLS
ALTER TABLE academic_years DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON academic_years;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON academic_years;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON academic_years;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON academic_years;

-- Re-enable RLS
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;

-- Create new policies with proper configuration
CREATE POLICY "Enable read access for all users"
ON academic_years FOR SELECT
USING (true);

CREATE POLICY "Enable insert access for all users"
ON academic_years FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
ON academic_years FOR UPDATE
USING (true);

CREATE POLICY "Enable delete access for all users"
ON academic_years FOR DELETE
USING (true);