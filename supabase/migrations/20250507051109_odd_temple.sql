/*
  # Add school management tables

  1. New Tables
    - `academic_years`
      - `id` (uuid, primary key)
      - `name` (text)
      - `start_date` (date)
      - `end_date` (date)
      - `status` (boolean)
      - `created_at` (timestamp)

    - `teachers`
      - `id` (uuid, primary key)
      - `name` (text)
      - `address` (text)
      - `date_of_birth` (date)
      - `place_of_birth` (text)
      - `phone` (text)
      - `join_date` (date)
      - `gender` (text)
      - `status` (boolean)
      - `created_at` (timestamp)

    - `teacher_roles`
      - `id` (uuid, primary key)
      - `teacher_id` (uuid, foreign key)
      - `role` (text)

    - `classes`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `teacher_id` (uuid, foreign key)
      - `created_at` (timestamp)

    - `levels`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `status` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create academic_years table
CREATE TABLE academic_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create teachers table
CREATE TABLE teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  date_of_birth date NOT NULL,
  place_of_birth text NOT NULL,
  phone text NOT NULL,
  join_date date NOT NULL,
  gender text NOT NULL CHECK (gender IN ('Ikhwan', 'Akhwat')),
  status boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create teacher_roles table
CREATE TABLE teacher_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE,
  role text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create classes table
CREATE TABLE classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  teacher_id uuid REFERENCES teachers(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Create levels table
CREATE TABLE levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  status boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Add foreign key constraints to existing students table
ALTER TABLE students 
ADD COLUMN teacher_id uuid REFERENCES teachers(id) ON DELETE SET NULL,
ADD COLUMN class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
ADD COLUMN level_id uuid REFERENCES levels(id) ON DELETE SET NULL;

-- Enable Row Level Security
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE levels ENABLE ROW LEVEL SECURITY;

-- Create policies for academic_years
CREATE POLICY "Allow authenticated users to read academic_years"
  ON academic_years FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert academic_years"
  ON academic_years FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update academic_years"
  ON academic_years FOR UPDATE TO authenticated USING (true);

-- Create policies for teachers
CREATE POLICY "Allow authenticated users to read teachers"
  ON teachers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert teachers"
  ON teachers FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update teachers"
  ON teachers FOR UPDATE TO authenticated USING (true);

-- Create policies for teacher_roles
CREATE POLICY "Allow authenticated users to read teacher_roles"
  ON teacher_roles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert teacher_roles"
  ON teacher_roles FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete teacher_roles"
  ON teacher_roles FOR DELETE TO authenticated USING (true);

-- Create policies for classes
CREATE POLICY "Allow authenticated users to read classes"
  ON classes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert classes"
  ON classes FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update classes"
  ON classes FOR UPDATE TO authenticated USING (true);

-- Create policies for levels
CREATE POLICY "Allow authenticated users to read levels"
  ON levels FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert levels"
  ON levels FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update levels"
  ON levels FOR UPDATE TO authenticated USING (true);