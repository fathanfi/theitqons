/*
  # Add points management tables

  1. New Tables
    - `points`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `point` (integer)
      - `created_at` (timestamp)

    - `student_points`
      - `id` (uuid, primary key) 
      - `student_id` (uuid, foreign key)
      - `point_id` (uuid, foreign key)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for all users
*/

-- Create points table
CREATE TABLE points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  point integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create student_points table
CREATE TABLE student_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  point_id uuid REFERENCES points(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE points ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_points ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users"
ON points FOR SELECT
USING (true);

CREATE POLICY "Enable insert access for all users"
ON points FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
ON points FOR UPDATE
USING (true);

CREATE POLICY "Enable delete access for all users"
ON points FOR DELETE
USING (true);

CREATE POLICY "Enable read access for all users"
ON student_points FOR SELECT
USING (true);

CREATE POLICY "Enable insert access for all users"
ON student_points FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
ON student_points FOR UPDATE
USING (true);

CREATE POLICY "Enable delete access for all users"
ON student_points FOR DELETE
USING (true);