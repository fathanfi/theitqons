/*
  # Add story management tables

  1. New Tables
    - `session_stories`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `start_date` (date)
      - `end_date` (date)
      - `parent_id` (uuid, self-referencing)
      - `status` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `stories`
      - `id` (uuid, primary key)
      - `session_story_id` (uuid, foreign key)
      - `name` (text)
      - `description` (text)
      - `publish_date` (date)
      - `status` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `story_actions`
      - `id` (uuid, primary key)
      - `story_id` (uuid, foreign key)
      - `action_name` (text)
      - `action_summary` (text)
      - `action_details` (text)
      - `participants` (text[])
      - `image_url` (text)
      - `doc_url` (text)
      - `publish_date` (date)
      - `status` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for all users
*/

-- Create session_stories table
CREATE TABLE session_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  parent_id uuid REFERENCES session_stories(id) ON DELETE SET NULL,
  status boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create stories table
CREATE TABLE stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_story_id uuid REFERENCES session_stories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  publish_date date NOT NULL,
  status boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create story_actions table
CREATE TABLE story_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES stories(id) ON DELETE CASCADE,
  action_name text NOT NULL,
  action_summary text NOT NULL,
  action_details text,
  participants text[] NOT NULL DEFAULT '{}',
  image_url text,
  doc_url text,
  publish_date date NOT NULL,
  status boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE session_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_actions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users"
ON session_stories FOR SELECT
USING (true);

CREATE POLICY "Enable insert access for all users"
ON session_stories FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
ON session_stories FOR UPDATE
USING (true);

CREATE POLICY "Enable delete access for all users"
ON session_stories FOR DELETE
USING (true);

CREATE POLICY "Enable read access for all users"
ON stories FOR SELECT
USING (true);

CREATE POLICY "Enable insert access for all users"
ON stories FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
ON stories FOR UPDATE
USING (true);

CREATE POLICY "Enable delete access for all users"
ON stories FOR DELETE
USING (true);

CREATE POLICY "Enable read access for all users"
ON story_actions FOR SELECT
USING (true);

CREATE POLICY "Enable insert access for all users"
ON story_actions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
ON story_actions FOR UPDATE
USING (true);

CREATE POLICY "Enable delete access for all users"
ON story_actions FOR DELETE
USING (true);