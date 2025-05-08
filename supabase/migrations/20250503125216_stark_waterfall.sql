/*
  # Initial schema for student management system

  1. New Tables
    - `students`
      - `id` (uuid, primary key)
      - `name` (text)
      - `gender` (text)
      - `address` (text)
      - `group` (text)
      - `teacher` (text)
      - `class` (text)
      - `points` (integer)
      - `level` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `badges`
      - `id` (uuid, primary key)
      - `icon` (text)
      - `description` (text)
      - `created_at` (timestamp)

    - `student_badges`
      - `student_id` (uuid, foreign key)
      - `badge_id` (uuid, foreign key)
      - `assigned_at` (timestamp)

    - `redemptions`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key)
      - `reward_name` (text)
      - `points` (integer)
      - `icon` (text)
      - `redeemed_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create students table
CREATE TABLE students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  gender text NOT NULL CHECK (gender IN ('Ikhwan', 'Akhwat')),
  address text NOT NULL,
  "group" text NOT NULL,
  teacher text NOT NULL,
  class text NOT NULL,
  points integer NOT NULL DEFAULT 0,
  level text NOT NULL CHECK (level IN ('Takhosus', '1', '28', '29', '30')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create badges table
CREATE TABLE badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  icon text NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create student_badges junction table
CREATE TABLE student_badges (
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  badge_id uuid REFERENCES badges(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  PRIMARY KEY (student_id, badge_id)
);

-- Create redemptions table
CREATE TABLE redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  reward_name text NOT NULL,
  points integer NOT NULL,
  icon text NOT NULL,
  redeemed_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read students"
  ON students FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert students"
  ON students FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update students"
  ON students FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete students"
  ON students FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read badges"
  ON badges FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert badges"
  ON badges FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete badges"
  ON badges FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read student_badges"
  ON student_badges FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert student_badges"
  ON student_badges FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete student_badges"
  ON student_badges FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read redemptions"
  ON redemptions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert redemptions"
  ON redemptions FOR INSERT TO authenticated WITH CHECK (true);