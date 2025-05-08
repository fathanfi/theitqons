/*
  # Add session management and groups

  1. New Tables
    - `groups`
      - `id` (uuid, primary key)
      - `academic_year_id` (uuid, foreign key)
      - `class_id` (uuid, foreign key)
      - `teacher_id` (uuid, foreign key)
      - `name` (text)
      - `created_at` (timestamp)

    - `group_students`
      - `group_id` (uuid, foreign key)
      - `student_id` (uuid, foreign key)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for all users
*/

-- Create groups table
CREATE TABLE groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id uuid REFERENCES academic_years(id) ON DELETE CASCADE,
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create group_students junction table
CREATE TABLE group_students (
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (group_id, student_id)
);

-- Enable RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_students ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users"
ON groups FOR SELECT
USING (true);

CREATE POLICY "Enable insert access for all users"
ON groups FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
ON groups FOR UPDATE
USING (true);

CREATE POLICY "Enable delete access for all users"
ON groups FOR DELETE
USING (true);

CREATE POLICY "Enable read access for all users"
ON group_students FOR SELECT
USING (true);

CREATE POLICY "Enable insert access for all users"
ON group_students FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
ON group_students FOR UPDATE
USING (true);

CREATE POLICY "Enable delete access for all users"
ON group_students FOR DELETE
USING (true);