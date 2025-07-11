/*
  # Fix RLS policies for student_registrations table
  
  This migration ensures that anonymous users can create registrations
  while maintaining security for admin operations.
*/

-- Temporarily disable RLS to clear any existing policies
ALTER TABLE student_registrations DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE student_registrations ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Allow public registration" ON student_registrations;
DROP POLICY IF EXISTS "Allow authenticated users to read registrations" ON student_registrations;
DROP POLICY IF EXISTS "Allow authenticated users to update registrations" ON student_registrations;
DROP POLICY IF EXISTS "Allow authenticated users to delete registrations" ON student_registrations;
DROP POLICY IF EXISTS "Allow all operations for registrations" ON student_registrations;

-- Create policy for anonymous users to INSERT (public registration)
CREATE POLICY "Allow anonymous registration"
  ON student_registrations
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create policy for authenticated users to INSERT (admin registration)
CREATE POLICY "Allow authenticated registration"
  ON student_registrations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy for authenticated users to SELECT (admin viewing)
CREATE POLICY "Allow authenticated users to read registrations"
  ON student_registrations
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy for authenticated users to UPDATE (admin management)
CREATE POLICY "Allow authenticated users to update registrations"
  ON student_registrations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policy for authenticated users to DELETE (admin management)
CREATE POLICY "Allow authenticated users to delete registrations"
  ON student_registrations
  FOR DELETE
  TO authenticated
  USING (true); 