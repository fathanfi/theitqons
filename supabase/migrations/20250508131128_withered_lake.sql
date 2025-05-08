/*
  # Add billing records table

  1. New Tables
    - `billing_records`
      - `id` (uuid, primary key)
      - `academic_year_id` (uuid, foreign key)
      - `student_id` (uuid, foreign key)
      - `month` (text)
      - `status` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
*/

CREATE TABLE billing_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id uuid REFERENCES academic_years(id) ON DELETE CASCADE,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  month text NOT NULL,
  status text NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add unique constraint to prevent duplicate records
ALTER TABLE billing_records
ADD CONSTRAINT unique_billing_record 
UNIQUE (academic_year_id, student_id, month);

-- Enable RLS
ALTER TABLE billing_records ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users"
ON billing_records FOR SELECT
USING (true);

CREATE POLICY "Enable insert access for all users"
ON billing_records FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
ON billing_records FOR UPDATE
USING (true);

CREATE POLICY "Enable delete access for all users"
ON billing_records FOR DELETE
USING (true);