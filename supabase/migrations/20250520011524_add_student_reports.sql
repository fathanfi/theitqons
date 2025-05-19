-- Create student_reports table
CREATE TABLE student_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id uuid REFERENCES academic_years(id) ON DELETE CASCADE,
  session_id integer NOT NULL, -- 1=SM1, 2=SM2
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  meta_values jsonb NOT NULL,
  published timestamptz DEFAULT now(),
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for fast lookup
CREATE INDEX idx_student_reports_student_id ON student_reports(student_id);
CREATE INDEX idx_student_reports_academic_year_id ON student_reports(academic_year_id);

-- Enable RLS
ALTER TABLE student_reports ENABLE ROW LEVEL SECURITY;

-- Policy: allow all for now (customize as needed)
CREATE POLICY "Allow all access" ON student_reports FOR ALL USING (true); 