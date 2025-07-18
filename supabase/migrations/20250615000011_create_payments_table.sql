-- Create payments table for tracking student payments
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  name text NOT NULL,
  total decimal(10,2) NOT NULL,
  type text NOT NULL CHECK (type IN ('cash', 'bsi ziswaf', 'bsi pptq', 'other')),
  photo_url text,
  akad jsonb NOT NULL DEFAULT '[]',
  student_id uuid REFERENCES students(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_payments_student_id ON payments(student_id);
CREATE INDEX idx_payments_date ON payments(date);
CREATE INDEX idx_payments_type ON payments(type);

-- Enable Row Level Security
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policies for payments
CREATE POLICY "Allow authenticated users to read payments"
  ON payments FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to insert payments"
  ON payments FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update payments"
  ON payments FOR UPDATE 
  TO authenticated 
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete payments"
  ON payments FOR DELETE 
  TO authenticated 
  USING (true);

-- Grant permissions
GRANT ALL ON payments TO authenticated;
GRANT ALL ON payments TO service_role;

-- Add comment
COMMENT ON TABLE payments IS 'Table for tracking student payments with various payment types and akad details'; 