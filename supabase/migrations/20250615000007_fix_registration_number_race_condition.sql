-- Fix race condition in registration number generation
-- This migration addresses the issue where multiple simultaneous registrations
-- could generate the same registration number, causing unique constraint violations.

-- Drop the existing function and trigger
DROP TRIGGER IF EXISTS trigger_set_registration_number ON student_registrations;
DROP FUNCTION IF EXISTS set_registration_number();
DROP FUNCTION IF EXISTS generate_registration_number();

-- Create a more robust registration number generation function
CREATE OR REPLACE FUNCTION generate_registration_number()
RETURNS text AS $$
DECLARE
  year_part text;
  sequence_num integer;
  reg_number text;
  max_attempts integer := 10;
  attempt integer := 0;
BEGIN
  -- Get current year
  year_part := EXTRACT(YEAR FROM CURRENT_DATE)::text;
  
  -- Retry loop to handle race conditions
  WHILE attempt < max_attempts LOOP
    BEGIN
      -- Use a more robust approach with proper locking
      -- Lock the table to prevent race conditions
      PERFORM pg_advisory_xact_lock(hashtext('student_registrations_registration_number'));
      
      -- Get next sequence number for this year with proper error handling
      SELECT COALESCE(MAX(CAST(SUBSTRING(registration_number FROM 9) AS integer)), 0) + 1
      INTO sequence_num
      FROM student_registrations
      WHERE registration_number LIKE year_part || '%';
      
      -- Format: YYYY-XXXX (e.g., 2025-0001)
      reg_number := year_part || '-' || LPAD(sequence_num::text, 4, '0');
      
      -- Verify the number doesn't already exist (double-check)
      IF NOT EXISTS (SELECT 1 FROM student_registrations WHERE registration_number = reg_number) THEN
        RETURN reg_number;
      END IF;
      
      -- If we get here, the number already exists, increment and try again
      sequence_num := sequence_num + 1;
      reg_number := year_part || '-' || LPAD(sequence_num::text, 4, '0');
      
      -- Final check
      IF NOT EXISTS (SELECT 1 FROM student_registrations WHERE registration_number = reg_number) THEN
        RETURN reg_number;
      END IF;
      
      -- If still exists, increment attempt counter and try again
      attempt := attempt + 1;
      
    EXCEPTION
      WHEN OTHERS THEN
        -- Log the error and retry
        RAISE NOTICE 'Error generating registration number (attempt %): %', attempt, SQLERRM;
        attempt := attempt + 1;
        -- Small delay to reduce contention
        PERFORM pg_sleep(0.1);
    END;
  END LOOP;
  
  -- If we get here, we've exhausted all attempts
  RAISE EXCEPTION 'Failed to generate unique registration number after % attempts', max_attempts;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to auto-generate registration number
CREATE OR REPLACE FUNCTION set_registration_number()
RETURNS trigger AS $$
BEGIN
  IF NEW.registration_number IS NULL THEN
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
COMMENT ON FUNCTION generate_registration_number() IS 'Generates unique registration numbers with race condition protection using advisory locks and retry logic'; 