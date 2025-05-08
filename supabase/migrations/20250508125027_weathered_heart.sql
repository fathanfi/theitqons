/*
  # Add year fields to billing settings

  1. Changes
    - Add start_year column to billing_settings table
    - Add end_year column to billing_settings table
*/

ALTER TABLE billing_settings 
ADD COLUMN start_year integer NOT NULL DEFAULT date_part('year', CURRENT_DATE),
ADD COLUMN end_year integer NOT NULL DEFAULT date_part('year', CURRENT_DATE);