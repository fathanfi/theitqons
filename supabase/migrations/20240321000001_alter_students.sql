-- Migration: Alter table new columns to 'students' table
ALTER TABLE students
ADD COLUMN place_of_birth TEXT,
ADD COLUMN date_of_birth DATE,
ADD COLUMN phone_number TEXT,
ADD COLUMN last_achievement TEXT,
ADD COLUMN total_pages INTEGER DEFAULT 0,
ADD COLUMN preview_image_url TEXT;