/*
  # Add exam management tables

  1. New Tables
    - `exams`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `itqon_exams`
      - `id` (uuid, primary key)
      - `exam_id` (uuid, foreign key)
      - `student_id` (uuid, foreign key)
      - `teacher_id` (uuid, foreign key)
      - `exam_date` (timestamptz)
      - `tahfidz_score` (text)
      - `tajwid_score` (text)
      - `status` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for all users
*/

-- Create exams table
CREATE TABLE exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create itqon_exams table
CREATE TABLE itqon_exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid REFERENCES exams(id) ON DELETE CASCADE,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE,
  exam_date timestamptz NOT NULL,
  tahfidz_score text CHECK (tahfidz_score IN ('Outstanding', 'Very Good', 'Good', 'Need Improvement', 'Bad', 'Very Bad')),
  tajwid_score text CHECK (tajwid_score IN ('Outstanding', 'Very Good', 'Good', 'Need Improvement', 'Bad', 'Very Bad')),
  status text CHECK (status IN ('Passed', 'Failed', 'Re-schedule')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE itqon_exams ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users"
ON exams FOR SELECT
USING (true);

CREATE POLICY "Enable insert access for all users"
ON exams FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
ON exams FOR UPDATE
USING (true);

CREATE POLICY "Enable delete access for all users"
ON exams FOR DELETE
USING (true);

CREATE POLICY "Enable read access for all users"
ON itqon_exams FOR SELECT
USING (true);

CREATE POLICY "Enable insert access for all users"
ON itqon_exams FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
ON itqon_exams FOR UPDATE
USING (true);

CREATE POLICY "Enable delete access for all users"
ON itqon_exams FOR DELETE
USING (true);