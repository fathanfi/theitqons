/*
  # Student Registration System

  This migration creates a student registration system that allows:
  1. Public registration without authentication
  2. Status tracking (Register, Test, Passed)
  3. Admin approval workflow
  4. Automatic transfer to students table when approved
*/

-- Create student_registrations table
CREATE TABLE student_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number text UNIQUE NOT NULL,
  name text NOT NULL,
  gender text NOT NULL CHECK (gender IN ('Ikhwan', 'Akhwat')),
  place_of_birth text,
  date_of_birth date,
  address text NOT NULL,
  phone_number text,
  father_name text,
  mother_name text,
  wali_name text,
  school_info text,
  previous_education text,
  registration_date timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'Register' CHECK (status IN ('Register', 'Test', 'Passed', 'Rejected')),
  test_date timestamptz,
  test_score integer,
  test_notes text,
  approved_by uuid,
  approved_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create function to generate registration number
CREATE OR REPLACE FUNCTION generate_registration_number()
RETURNS text AS $$
DECLARE
  year_part text;
  sequence_num integer;
  reg_number text;
BEGIN
  -- Get current year
  year_part := EXTRACT(YEAR FROM CURRENT_DATE)::text;
  
  -- Get next sequence number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(registration_number FROM 9) AS integer)), 0) + 1
  INTO sequence_num
  FROM student_registrations
  WHERE registration_number LIKE year_part || '%';
  
  -- Format: YYYY-XXXX (e.g., 2025-0001)
  reg_number := year_part || '-' || LPAD(sequence_num::text, 4, '0');
  
  RETURN reg_number;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate registration number
CREATE OR REPLACE FUNCTION set_registration_number()
RETURNS trigger AS $$
BEGIN
  IF NEW.registration_number IS NULL THEN
    NEW.registration_number := generate_registration_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_registration_number
  BEFORE INSERT ON student_registrations
  FOR EACH ROW
  EXECUTE FUNCTION set_registration_number();

-- Create function to transfer approved registration to students table
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

-- Create trigger to auto-transfer approved registrations
CREATE TRIGGER trigger_transfer_approved_registration
  AFTER UPDATE ON student_registrations
  FOR EACH ROW
  EXECUTE FUNCTION transfer_approved_registration();

-- Enable Row Level Security
ALTER TABLE student_registrations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public registration" ON student_registrations;
DROP POLICY IF EXISTS "Allow authenticated users to read registrations" ON student_registrations;
DROP POLICY IF EXISTS "Allow authenticated users to update registrations" ON student_registrations;
DROP POLICY IF EXISTS "Allow authenticated users to delete registrations" ON student_registrations;

-- Create policies for public registration (no auth required for INSERT)
CREATE POLICY "Allow public registration"
  ON student_registrations FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (true);

-- Create policies for authenticated users (admins/teachers)
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

-- Create indexes for better performance
CREATE INDEX idx_student_registrations_status ON student_registrations(status);
CREATE INDEX idx_student_registrations_registration_date ON student_registrations(registration_date);
CREATE INDEX idx_student_registrations_registration_number ON student_registrations(registration_number);

-- Insert default class and level if they don't exist
INSERT INTO classes (name) VALUES ('Pendaftaran Baru') ON CONFLICT DO NOTHING;
INSERT INTO levels (name) VALUES ('Takhosus') ON CONFLICT DO NOTHING; 