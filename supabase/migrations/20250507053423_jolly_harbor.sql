/*
  # Fix RLS policies for academic years table

  1. Changes
    - Drop existing RLS policies for academic_years table
    - Create new policies with proper access control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read academic_years" ON academic_years;
DROP POLICY IF EXISTS "Allow authenticated users to insert academic_years" ON academic_years;
DROP POLICY IF EXISTS "Allow authenticated users to update academic_years" ON academic_years;

-- Create new policies
CREATE POLICY "Enable read access for authenticated users"
ON academic_years FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert access for authenticated users"
ON academic_years FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
ON academic_years FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users"
ON academic_years FOR DELETE
TO authenticated
USING (true);