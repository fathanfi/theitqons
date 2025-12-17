/*
  # Add unique constraint to student_reports table

  1. Changes:
    - Add unique constraint on (academic_year_id, session_id, student_id)
    - This prevents duplicate reports for the same student in the same academic year and session

  2. Before applying:
    - If there are existing duplicates, you may need to clean them up first
    - You can use this query to find duplicates:
      SELECT academic_year_id, session_id, student_id, COUNT(*) 
      FROM student_reports 
      GROUP BY academic_year_id, session_id, student_id 
      HAVING COUNT(*) > 1;
    - This constraint will prevent new duplicates from being inserted at the database level
*/

-- Create a unique constraint on the combination of academic_year_id, session_id, and student_id
-- This ensures that each student can only have one report per academic year and session
-- Note: This will fail if duplicates already exist. Clean them up first if needed.
DO $$
BEGIN
  -- Check if constraint already exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'student_reports_unique_academic_session_student'
  ) THEN
    ALTER TABLE student_reports 
    ADD CONSTRAINT student_reports_unique_academic_session_student 
    UNIQUE (academic_year_id, session_id, student_id);
  END IF;
END $$;

