-- Create student upgrade history table
CREATE TABLE IF NOT EXISTS student_upgrade_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('level', 'class')),
  from_id UUID,
  to_id UUID NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_upgrade_history_student_id ON student_upgrade_history(student_id);
CREATE INDEX IF NOT EXISTS idx_student_upgrade_history_type ON student_upgrade_history(type);
CREATE INDEX IF NOT EXISTS idx_student_upgrade_history_date ON student_upgrade_history(date);

-- Enable RLS
ALTER TABLE student_upgrade_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for authenticated users" ON student_upgrade_history
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON student_upgrade_history
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON student_upgrade_history
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for admin users" ON student_upgrade_history
  FOR DELETE USING (auth.role() = 'admin');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_student_upgrade_history_updated_at
  BEFORE UPDATE ON student_upgrade_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 