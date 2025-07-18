-- Fix payments table to ensure student_id can be NULL
-- This migration ensures the student_id column is properly configured

-- First, drop any existing constraints that might prevent NULL values
ALTER TABLE payments ALTER COLUMN student_id DROP NOT NULL;

-- Ensure the foreign key constraint is properly set up
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_student_id_fkey;
ALTER TABLE payments ADD CONSTRAINT payments_student_id_fkey 
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL;

-- Add comment
COMMENT ON COLUMN payments.student_id IS 'Optional reference to student. Can be NULL for general payments.'; 