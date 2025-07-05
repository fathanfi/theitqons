-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read academic calendar events" ON academic_calendar_events;
DROP POLICY IF EXISTS "Allow admin users to insert academic calendar events" ON academic_calendar_events;
DROP POLICY IF EXISTS "Allow admin users to update academic calendar events" ON academic_calendar_events;
DROP POLICY IF EXISTS "Allow admin users to delete academic calendar events" ON academic_calendar_events;

-- Create simpler, more permissive policies
-- Allow all authenticated users to read events
CREATE POLICY "Allow authenticated users to read academic calendar events" ON academic_calendar_events
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow all authenticated users to insert events (we'll handle admin check in the application)
CREATE POLICY "Allow authenticated users to insert academic calendar events" ON academic_calendar_events
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow all authenticated users to update events (we'll handle admin check in the application)
CREATE POLICY "Allow authenticated users to update academic calendar events" ON academic_calendar_events
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow all authenticated users to delete events (we'll handle admin check in the application)
CREATE POLICY "Allow authenticated users to delete academic calendar events" ON academic_calendar_events
  FOR DELETE USING (auth.role() = 'authenticated'); 