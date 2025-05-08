-- Temporarily disable RLS
ALTER TABLE teachers DISABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE levels DISABLE ROW LEVEL SECURITY;

-- Drop existing policies for teachers
DROP POLICY IF EXISTS "Allow authenticated users to read teachers" ON teachers;
DROP POLICY IF EXISTS "Allow authenticated users to insert teachers" ON teachers;
DROP POLICY IF EXISTS "Allow authenticated users to update teachers" ON teachers;

-- Drop existing policies for teacher_roles
DROP POLICY IF EXISTS "Allow authenticated users to read teacher_roles" ON teacher_roles;
DROP POLICY IF EXISTS "Allow authenticated users to insert teacher_roles" ON teacher_roles;
DROP POLICY IF EXISTS "Allow authenticated users to delete teacher_roles" ON teacher_roles;

-- Drop existing policies for classes
DROP POLICY IF EXISTS "Allow authenticated users to read classes" ON classes;
DROP POLICY IF EXISTS "Allow authenticated users to insert classes" ON classes;
DROP POLICY IF EXISTS "Allow authenticated users to update classes" ON classes;

-- Drop existing policies for levels
DROP POLICY IF EXISTS "Allow authenticated users to read levels" ON levels;
DROP POLICY IF EXISTS "Allow authenticated users to insert levels" ON levels;
DROP POLICY IF EXISTS "Allow authenticated users to update levels" ON levels;

-- Re-enable RLS
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE levels ENABLE ROW LEVEL SECURITY;

-- Create new policies for teachers
CREATE POLICY "Enable read access for all users"
ON teachers FOR SELECT
USING (true);

CREATE POLICY "Enable insert access for all users"
ON teachers FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
ON teachers FOR UPDATE
USING (true);

CREATE POLICY "Enable delete access for all users"
ON teachers FOR DELETE
USING (true);

-- Create new policies for teacher_roles
CREATE POLICY "Enable read access for all users"
ON teacher_roles FOR SELECT
USING (true);

CREATE POLICY "Enable insert access for all users"
ON teacher_roles FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
ON teacher_roles FOR UPDATE
USING (true);

CREATE POLICY "Enable delete access for all users"
ON teacher_roles FOR DELETE
USING (true);

-- Create new policies for classes
CREATE POLICY "Enable read access for all users"
ON classes FOR SELECT
USING (true);

CREATE POLICY "Enable insert access for all users"
ON classes FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
ON classes FOR UPDATE
USING (true);

CREATE POLICY "Enable delete access for all users"
ON classes FOR DELETE
USING (true);

-- Create new policies for levels
CREATE POLICY "Enable read access for all users"
ON levels FOR SELECT
USING (true);

CREATE POLICY "Enable insert access for all users"
ON levels FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
ON levels FOR UPDATE
USING (true);

CREATE POLICY "Enable delete access for all users"
ON levels FOR DELETE
USING (true);