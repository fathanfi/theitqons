-- Simplify registration number generation using PostgreSQL sequence
-- This approach is more reliable and avoids race conditions

-- Drop the existing function and trigger
DROP TRIGGER IF EXISTS trigger_set_registration_number ON student_registrations;
DROP FUNCTION IF EXISTS set_registration_number();
DROP FUNCTION IF EXISTS generate_registration_number();

-- Create a sequence for registration numbers
CREATE SEQUENCE IF NOT EXISTS registration_number_seq;

-- Create a simpler and more reliable registration number generation function
CREATE OR REPLACE FUNCTION generate_registration_number()
RETURNS text AS $$
DECLARE
  year_part text;
  sequence_num integer;
  reg_number text;
BEGIN
  -- Get current year
  year_part := EXTRACT(YEAR FROM CURRENT_DATE)::text;
  
  -- Get next value from sequence
  sequence_num := nextval('registration_number_seq');
  
  -- Format: YYYY-XXXX (e.g., 2025-0001)
  reg_number := year_part || '-' || LPAD(sequence_num::text, 4, '0');
  
  RETURN reg_number;
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
COMMENT ON FUNCTION generate_registration_number() IS 'Generates unique registration numbers using PostgreSQL sequence to avoid race conditions'; 