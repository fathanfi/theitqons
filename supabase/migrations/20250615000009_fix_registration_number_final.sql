-- Final fix for registration number generation
-- This migration handles existing data and ensures proper sequence initialization

-- Drop the existing function and trigger
DROP TRIGGER IF EXISTS trigger_set_registration_number ON student_registrations;
DROP FUNCTION IF EXISTS set_registration_number();
DROP FUNCTION IF EXISTS generate_registration_number();

-- Drop the sequence if it exists
DROP SEQUENCE IF EXISTS registration_number_seq;

-- Create a new sequence for registration numbers
CREATE SEQUENCE registration_number_seq;

-- Initialize the sequence with the maximum existing registration number
-- This ensures we don't generate duplicate numbers
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
END $$;

-- Create a robust registration number generation function
CREATE OR REPLACE FUNCTION generate_registration_number()
RETURNS text AS $$
DECLARE
  year_part text;
  sequence_num integer;
  reg_number text;
  max_attempts integer := 5;
  attempt integer := 0;
BEGIN
  -- Get current year
  year_part := EXTRACT(YEAR FROM CURRENT_DATE)::text;
  
  -- Try to generate a unique number
  WHILE attempt < max_attempts LOOP
    -- Get next value from sequence
    sequence_num := nextval('registration_number_seq');
    
    -- Format: YYYY-XXXX (e.g., 2025-0001)
    reg_number := year_part || '-' || LPAD(sequence_num::text, 4, '0');
    
    -- Check if this number already exists (shouldn't happen with sequence, but just in case)
    IF NOT EXISTS (SELECT 1 FROM student_registrations WHERE registration_number = reg_number) THEN
      RETURN reg_number;
    END IF;
    
    -- If we get here, there's a conflict (very unlikely with sequence)
    attempt := attempt + 1;
  END LOOP;
  
  -- If we get here, something is wrong
  RAISE EXCEPTION 'Failed to generate unique registration number after % attempts', max_attempts;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to auto-generate registration number
CREATE OR REPLACE FUNCTION set_registration_number()
RETURNS trigger AS $$
BEGIN
  IF NEW.registration_number IS NULL OR NEW.registration_number = '' THEN
    NEW.registration_number := generate_registration_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trigger_set_registration_number
  BEFORE INSERT ON student_registrations
  FOR EACH ROW
  EXECUTE FUNCTION set_registration_number();

-- Add a comment to document the fix
COMMENT ON FUNCTION generate_registration_number() IS 'Generates unique registration numbers using PostgreSQL sequence with proper initialization'; 