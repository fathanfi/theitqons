/*
  # Add billing settings table

  1. New Tables
    - `billing_settings`
      - `id` (uuid, primary key)
      - `academic_year_id` (uuid, foreign key)
      - `monthly_price` (integer)
      - `billing_target` (integer)
      - `target_percentage` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for all users
*/

CREATE TABLE billing_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id uuid REFERENCES academic_years(id) ON DELETE CASCADE,
  monthly_price integer NOT NULL,
  billing_target integer NOT NULL,
  target_percentage integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE billing_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users"
ON billing_settings FOR SELECT
USING (true);

CREATE POLICY "Enable insert access for all users"
ON billing_settings FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
ON billing_settings FOR UPDATE
USING (true);

CREATE POLICY "Enable delete access for all users"
ON billing_settings FOR DELETE
USING (true);