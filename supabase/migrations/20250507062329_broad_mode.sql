/*
  # Add session and groups management

  1. Changes
    - Add unique constraint to level names
    - Add unique constraint to group names within an academic year
*/

-- Add unique constraint to level names
ALTER TABLE levels
ADD CONSTRAINT unique_level_name UNIQUE (name);

-- Add unique constraint to group names within an academic year
ALTER TABLE groups
ADD CONSTRAINT unique_group_name_per_year UNIQUE (name, academic_year_id);