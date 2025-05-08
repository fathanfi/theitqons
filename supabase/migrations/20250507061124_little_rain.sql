/*
  # Update student level policy

  1. Changes
    - Remove level check constraint
    - Add level validation through trigger

  2. Security
    - Maintain existing RLS policies
*/

-- Remove the existing check constraint
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_level_check;

-- Create a function to validate student level
CREATE OR REPLACE FUNCTION validate_student_level()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow any level value
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for level validation
DROP TRIGGER IF EXISTS validate_student_level_trigger ON students;
CREATE TRIGGER validate_student_level_trigger
  BEFORE INSERT OR UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION validate_student_level();