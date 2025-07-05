-- Create academic_calendar_events table
CREATE TABLE academic_calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  location VARCHAR(255),
  event_type VARCHAR(50) DEFAULT 'general',
  color VARCHAR(7) DEFAULT '#3B82F6',
  is_all_day BOOLEAN DEFAULT false,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE academic_calendar_events ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read events
CREATE POLICY "Allow authenticated users to read academic calendar events" ON academic_calendar_events
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow admin users to insert events
CREATE POLICY "Allow admin users to insert academic calendar events" ON academic_calendar_events
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    (auth.jwt() ->> 'role' = 'admin' OR 
     auth.uid() IN ('8d32e5ad-df88-4132-b675-c0c4b9b36b52', '96ab64fd-0473-42c4-947c-dcb1393f39c3'))
  );

-- Allow admin users to update events
CREATE POLICY "Allow admin users to update academic calendar events" ON academic_calendar_events
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND 
    (auth.jwt() ->> 'role' = 'admin' OR 
     auth.uid() IN ('8d32e5ad-df88-4132-b675-c0c4b9b36b52', '96ab64fd-0473-42c4-947c-dcb1393f39c3'))
  );

-- Allow admin users to delete events
CREATE POLICY "Allow admin users to delete academic calendar events" ON academic_calendar_events
  FOR DELETE USING (
    auth.role() = 'authenticated' AND 
    (auth.jwt() ->> 'role' = 'admin' OR 
     auth.uid() IN ('8d32e5ad-df88-4132-b675-c0c4b9b36b52', '96ab64fd-0473-42c4-947c-dcb1393f39c3'))
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_academic_calendar_events_updated_at 
    BEFORE UPDATE ON academic_calendar_events 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 