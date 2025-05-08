-- Temporarily disable RLS
ALTER TABLE students DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read students" ON students;
DROP POLICY IF EXISTS "Allow authenticated users to insert students" ON students;
DROP POLICY IF EXISTS "Allow authenticated users to update students" ON students;
DROP POLICY IF EXISTS "Allow authenticated users to delete students" ON students;

-- Re-enable RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Create new policies with proper configuration
CREATE POLICY "Enable read access for all users"
ON students FOR SELECT
USING (true);

CREATE POLICY "Enable insert access for all users"
ON students FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
ON students FOR UPDATE
USING (true);

CREATE POLICY "Enable delete access for all users"
ON students FOR DELETE
USING (true);