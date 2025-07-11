-- Add payment_status column to student_registrations table
ALTER TABLE student_registrations 
ADD COLUMN payment_status TEXT DEFAULT 'NOT PAID' CHECK (payment_status IN ('NOT PAID', 'PAID'));

-- Update RLS policies to include payment_status
DROP POLICY IF EXISTS "Enable read access for all users" ON student_registrations;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON student_registrations;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON student_registrations;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON student_registrations;

-- Create new policies that include payment_status
CREATE POLICY "Enable read access for all users" ON student_registrations
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON student_registrations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON student_registrations
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON student_registrations
    FOR DELETE USING (auth.role() = 'authenticated'); 