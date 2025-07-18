-- Comprehensive fix for registration number generation
-- This migration addresses all potential issues: sequence, triggers, RLS, and permissions

-- Step 1: Drop existing functions and triggers
DROP TRIGGER IF EXISTS trigger_set_registration_number ON student_registrations;
DROP FUNCTION IF EXISTS set_registration_number();
DROP FUNCTION IF EXISTS generate_registration_number();

-- Step 2: Drop and recreate the sequence with proper permissions
DROP SEQUENCE IF EXISTS registration_number_seq;
CREATE SEQUENCE registration_number_seq;

-- Step 3: Grant sequence permissions to all roles
GRANT USAGE, SELECT ON SEQUENCE registration_number_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE registration_number_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE registration_number_seq TO service_role;

-- Step 4: Initialize sequence with existing data
DO $$
DECLARE
  max_seq integer;
  year_part text;
BEGIN
  -- Get current year
  year_part := EXTRACT(YEAR FROM CURRENT_DATE)::text;
  
  -- Find the maximum sequence number from existing registrations for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(registration_number FROM 9) AS integer)), 0)
  INTO max_seq
  FROM student_registrations
  WHERE registration_number LIKE year_part || '%';
  
  -- Set the sequence to start from the next value
  IF max_seq > 0 THEN
    PERFORM setval('registration_number_seq', max_seq);
  END IF;
  
  RAISE NOTICE 'Initialized sequence with max value: %', max_seq;
END $$;

-- Step 5: Create a simple and reliable registration number generation function
CREATE OR REPLACE FUNCTION generate_registration_number()
RETURNS text AS $$
DECLARE
  year_part text;
  sequence_num integer;
  reg_number text;
BEGIN
  -- Get current year
  year_part := EXTRACT(YEAR FROM CURRENT_DATE)::text;
  
  -- Get next value from sequence (this is atomic and thread-safe)
  sequence_num := nextval('registration_number_seq');
  
  -- Format: YYYY-XXXX (e.g., 2025-0001)
  reg_number := year_part || '-' || LPAD(sequence_num::text, 4, '0');
  
  RETURN reg_number;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger function
CREATE OR REPLACE FUNCTION set_registration_number()
RETURNS trigger AS $$
BEGIN
  -- Only set registration_number if it's NULL or empty
  IF NEW.registration_number IS NULL OR NEW.registration_number = '' THEN
    NEW.registration_number := generate_registration_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create the trigger
CREATE TRIGGER trigger_set_registration_number
  BEFORE INSERT ON student_registrations
  FOR EACH ROW
  EXECUTE FUNCTION set_registration_number();

-- Step 8: Ensure RLS is properly configured
ALTER TABLE student_registrations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all operations" ON student_registrations;
DROP POLICY IF EXISTS "Allow public registration" ON student_registrations;
DROP POLICY IF EXISTS "Allow authenticated users to read registrations" ON student_registrations;
DROP POLICY IF EXISTS "Allow authenticated users to update registrations" ON student_registrations;
DROP POLICY IF EXISTS "Allow authenticated users to delete registrations" ON student_registrations;

-- Create new policies
CREATE POLICY "Allow public registration"
  ON student_registrations FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read registrations"
  ON student_registrations FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to update registrations"
  ON student_registrations FOR UPDATE 
  TO authenticated 
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete registrations"
  ON student_registrations FOR DELETE 
  TO authenticated 
  USING (true);

-- Step 9: Grant table permissions
GRANT ALL ON student_registrations TO anon;
GRANT ALL ON student_registrations TO authenticated;
GRANT ALL ON student_registrations TO service_role;

-- Step 10: Add comments for documentation
COMMENT ON FUNCTION generate_registration_number() IS 'Generates unique registration numbers using PostgreSQL sequence';
COMMENT ON FUNCTION set_registration_number() IS 'Trigger function to auto-generate registration numbers';
COMMENT ON SEQUENCE registration_number_seq IS 'Sequence for generating unique registration numbers'; 