/*
  # Remove points from students table
  
  1. Changes
    - Remove points column from students table
    - Update student points system to use student_points table
*/

-- Remove points column from students table
ALTER TABLE students DROP COLUMN IF EXISTS points;