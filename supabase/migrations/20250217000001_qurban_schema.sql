-- Create Qurban Edition table
CREATE TABLE qurban_editions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  start TIMESTAMP WITH TIME ZONE NOT NULL,
  end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Qurban Animal table
CREATE TABLE qurban_animals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cow', 'goat', 'sheep', 'camel')),
  description TEXT,
  for_whom TEXT NOT NULL,
  location TEXT NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('available', 'reserved', 'sold', 'slaughtered')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Qurbanku table
CREATE TABLE qurbanku (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  animal_id UUID NOT NULL REFERENCES qurban_animals(id),
  qurban_edition_id UUID NOT NULL REFERENCES qurban_editions(id),
  process JSONB NOT NULL DEFAULT '{
    "payment": {"status": "pending"},
    "slaughter": {"status": "pending"},
    "distribution": {"status": "pending"}
  }',
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'processing', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Qurban Sedekah table
CREATE TABLE qurban_sedekah (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  from TEXT NOT NULL,
  via TEXT NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Qurban Operasional table
CREATE TABLE qurban_operasional (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  qurban_edition_id UUID NOT NULL REFERENCES qurban_editions(id),
  name TEXT NOT NULL,
  description TEXT,
  budget DECIMAL(12,2) NOT NULL,
  reality DECIMAL(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_qurban_editions_updated_at
  BEFORE UPDATE ON qurban_editions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qurban_animals_updated_at
  BEFORE UPDATE ON qurban_animals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qurbanku_updated_at
  BEFORE UPDATE ON qurbanku
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qurban_sedekah_updated_at
  BEFORE UPDATE ON qurban_sedekah
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qurban_operasional_updated_at
  BEFORE UPDATE ON qurban_operasional
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE qurban_editions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qurban_animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE qurbanku ENABLE ROW LEVEL SECURITY;
ALTER TABLE qurban_sedekah ENABLE ROW LEVEL SECURITY;
ALTER TABLE qurban_operasional ENABLE ROW LEVEL SECURITY;

-- Qurban Editions policies
CREATE POLICY "Qurban editions are viewable by everyone"
  ON qurban_editions FOR SELECT
  USING (true);

CREATE POLICY "Qurban editions are insertable by authenticated users"
  ON qurban_editions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Qurban editions are updatable by authenticated users"
  ON qurban_editions FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Qurban Animals policies
CREATE POLICY "Qurban animals are viewable by everyone"
  ON qurban_animals FOR SELECT
  USING (true);

CREATE POLICY "Qurban animals are insertable by authenticated users"
  ON qurban_animals FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Qurban animals are updatable by authenticated users"
  ON qurban_animals FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Qurbanku policies
CREATE POLICY "Users can view their own qurbanku"
  ON qurbanku FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own qurbanku"
  ON qurbanku FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own qurbanku"
  ON qurbanku FOR UPDATE
  USING (auth.uid() = user_id);

-- Qurban Sedekah policies
CREATE POLICY "Qurban sedekah are viewable by everyone"
  ON qurban_sedekah FOR SELECT
  USING (true);

CREATE POLICY "Qurban sedekah are insertable by authenticated users"
  ON qurban_sedekah FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Qurban sedekah are updatable by authenticated users"
  ON qurban_sedekah FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Qurban Operasional policies
CREATE POLICY "Qurban operasional are viewable by everyone"
  ON qurban_operasional FOR SELECT
  USING (true);

CREATE POLICY "Qurban operasional are insertable by authenticated users"
  ON qurban_operasional FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Qurban operasional are updatable by authenticated users"
  ON qurban_operasional FOR UPDATE
  USING (auth.role() = 'authenticated'); 