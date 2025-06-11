-- Update RLS policies for Qurban tables to allow all authenticated users to insert and update

-- Qurban Editions
DROP POLICY IF EXISTS "Qurban editions are insertable by authenticated users" ON qurban_editions;
DROP POLICY IF EXISTS "Qurban editions are updatable by authenticated users" ON qurban_editions;
DROP POLICY IF EXISTS "Allow all authenticated users to insert editions" ON qurban_editions;
DROP POLICY IF EXISTS "Allow all authenticated users to update editions" ON qurban_editions;
CREATE POLICY "Allow all authenticated users to insert editions"
  ON qurban_editions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow all authenticated users to update editions"
  ON qurban_editions FOR UPDATE TO authenticated USING (true);

-- Qurban Animals
DROP POLICY IF EXISTS "Qurban animals are insertable by authenticated users" ON qurban_animals;
DROP POLICY IF EXISTS "Qurban animals are updatable by authenticated users" ON qurban_animals;
DROP POLICY IF EXISTS "Allow all authenticated users to insert animals" ON qurban_animals;
DROP POLICY IF EXISTS "Allow all authenticated users to update animals" ON qurban_animals;
CREATE POLICY "Allow all authenticated users to insert animals"
  ON qurban_animals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow all authenticated users to update animals"
  ON qurban_animals FOR UPDATE TO authenticated USING (true);

-- Qurban Sedekah
DROP POLICY IF EXISTS "Qurban sedekah are insertable by authenticated users" ON qurban_sedekah;
DROP POLICY IF EXISTS "Qurban sedekah are updatable by authenticated users" ON qurban_sedekah;
DROP POLICY IF EXISTS "Allow all authenticated users to insert sedekah" ON qurban_sedekah;
DROP POLICY IF EXISTS "Allow all authenticated users to update sedekah" ON qurban_sedekah;
CREATE POLICY "Allow all authenticated users to insert sedekah"
  ON qurban_sedekah FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow all authenticated users to update sedekah"
  ON qurban_sedekah FOR UPDATE TO authenticated USING (true);

-- Qurban Operasional
DROP POLICY IF EXISTS "Qurban operasional are insertable by authenticated users" ON qurban_operasional;
DROP POLICY IF EXISTS "Qurban operasional are updatable by authenticated users" ON qurban_operasional;
DROP POLICY IF EXISTS "Allow all authenticated users to insert operasional" ON qurban_operasional;
DROP POLICY IF EXISTS "Allow all authenticated users to update operasional" ON qurban_operasional;
CREATE POLICY "Allow all authenticated users to insert operasional"
  ON qurban_operasional FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow all authenticated users to update operasional"
  ON qurban_operasional FOR UPDATE TO authenticated USING (true);

-- Qurbanku (already allows only the user to insert/update their own records)
-- No change needed unless you want to allow broader access. 