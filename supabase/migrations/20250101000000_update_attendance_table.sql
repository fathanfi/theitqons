-- Update attendance table to support weekly attendance tracking
-- This migration modifies the existing attendance table to support academic year and group-based weekly attendance

-- First, drop the existing attendance table and recreate it with the new structure
DROP TABLE IF EXISTS attendance CASCADE;

-- Create new attendance table with weekly tracking support
CREATE TABLE attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  academic_year_id uuid REFERENCES academic_years(id) ON DELETE CASCADE,
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  week_number integer NOT NULL,
  year integer NOT NULL,
  day_index integer NOT NULL CHECK (day_index >= 0 AND day_index <= 4), -- 0 = Monday, 1 = Tuesday, etc.
  status text NOT NULL CHECK (status IN ('present', 'sick', 'permit', 'absent')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for better query performance
CREATE INDEX idx_attendance_academic_year_id ON attendance(academic_year_id);
CREATE INDEX idx_attendance_group_id ON attendance(group_id);
CREATE INDEX idx_attendance_student_week ON attendance(student_id, week_number, year);
CREATE INDEX idx_attendance_week_group ON attendance(week_number, year, group_id);

-- Add unique constraint to prevent duplicate attendance records
CREATE UNIQUE INDEX idx_attendance_unique ON attendance(student_id, academic_year_id, group_id, week_number, year, day_index);

-- Enable RLS
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to view attendance records
CREATE POLICY "Users can view attendance records" ON attendance
FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for teachers and admins to insert attendance records
CREATE POLICY "Teachers and admins can insert attendance records" ON attendance
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND (
    EXISTS (
      SELECT 1 FROM teacher_roles 
      WHERE teacher_roles.teacher_id = auth.uid() 
      AND teacher_roles.role IN ('teacher', 'admin')
    ) OR 
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  )
);

-- Policy for teachers and admins to update attendance records
CREATE POLICY "Teachers and admins can update attendance records" ON attendance
FOR UPDATE USING (
  auth.role() = 'authenticated' AND (
    EXISTS (
      SELECT 1 FROM teacher_roles 
      WHERE teacher_roles.teacher_id = auth.uid() 
      AND teacher_roles.role IN ('teacher', 'admin')
    ) OR 
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  )
);

-- Policy for teachers and admins to delete attendance records
CREATE POLICY "Teachers and admins can delete attendance records" ON attendance
FOR DELETE USING (
  auth.role() = 'authenticated' AND (
    EXISTS (
      SELECT 1 FROM teacher_roles 
      WHERE teacher_roles.teacher_id = auth.uid() 
      AND teacher_roles.role IN ('teacher', 'admin')
    ) OR 
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  )
); 