/*
  # Fix transfer function with correct column names
  
  This migration fixes the transfer_approved_registration function
  to use the correct snake_case column names that match the database.
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS transfer_approved_registration();

-- Recreate the function with correct column names
CREATE OR REPLACE FUNCTION transfer_approved_registration()
RETURNS trigger AS $$
DECLARE
  new_student_id uuid;
BEGIN
  -- Only process when status changes to 'Passed'
  IF NEW.status = 'Passed' AND (OLD.status IS NULL OR OLD.status != 'Passed') THEN
    -- Insert into students table
    INSERT INTO students (
      name,
      gender,
      address,
      class_id,
      level_id,
      father_name,
      mother_name,
      wali_name,
      school_info,
      place_of_birth,
      date_of_birth,
      phone_number,
      registration_number,
      joined_date,
      notes,
      status,
      created_at,
      updated_at
    ) VALUES (
      NEW.name,
      NEW.gender,
      NEW.address,
      (SELECT id FROM classes WHERE name = 'Pendaftaran Baru' LIMIT 1), -- Default class for new students
      (SELECT id FROM levels WHERE name = 'Takhosus' LIMIT 1), -- Default level for new students
      NEW.father_name,
      NEW.mother_name,
      NEW.wali_name,
      NEW.school_info,
      NEW.place_of_birth,
      NEW.date_of_birth,
      NEW.phone_number,
      NEW.registration_number,
      CURRENT_DATE,
      NEW.notes,
      true,
      now(),
      now()
    ) RETURNING id INTO new_student_id;
    
    -- Update registration with student_id reference
    UPDATE student_registrations 
    SET approved_at = now()
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Make sure the trigger exists
DROP TRIGGER IF EXISTS trigger_transfer_approved_registration ON student_registrations;

CREATE TRIGGER trigger_transfer_approved_registration
  AFTER UPDATE ON student_registrations
  FOR EACH ROW
  EXECUTE FUNCTION transfer_approved_registration(); 