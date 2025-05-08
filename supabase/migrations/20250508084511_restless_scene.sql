/*
  # Add status field to students table

  1. Changes
    - Add status column to students table with default value true
*/

-- Add status column to students table
ALTER TABLE students ADD COLUMN status boolean NOT NULL DEFAULT true;