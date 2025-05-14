/*
  # Add school settings table

  1. New Tables
    - `school_settings`
      - Basic information fields
      - JSON fields for complex data storage
      - Location and contact information
*/

CREATE TABLE school_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  account_number text,
  principal_name text,
  established_year integer,
  address text,
  city text,
  state_province text,
  postal_code text,
  country text,
  phone_number text,
  email text,
  website_url text,
  facilities jsonb DEFAULT '[]'::jsonb,
  student_count jsonb DEFAULT '[]'::jsonb,
  staff_count jsonb DEFAULT '[]'::jsonb,
  school_code text,
  latitude numeric,
  longitude numeric,
  bank_account jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE school_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users"
ON school_settings FOR SELECT
USING (true);

CREATE POLICY "Enable insert access for all users"
ON school_settings FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
ON school_settings FOR UPDATE
USING (true);

CREATE POLICY "Enable delete access for all users"
ON school_settings FOR DELETE
USING (true);