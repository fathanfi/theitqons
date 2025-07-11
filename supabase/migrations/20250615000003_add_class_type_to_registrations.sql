-- Add class_type column to student_registrations table
ALTER TABLE student_registrations 
ADD COLUMN class_type INTEGER NOT NULL DEFAULT 1;

-- Add comment to explain the class types
COMMENT ON COLUMN student_registrations.class_type IS '1: Sore (16.00-17.15 WIB), 2: Malam (18.15-19.30 WIB), 3: Online (Fleksibel)'; 