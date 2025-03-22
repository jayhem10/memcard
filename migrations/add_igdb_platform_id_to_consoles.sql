-- Ajouter les colonnes à la table consoles
ALTER TABLE consoles 
ADD COLUMN IF NOT EXISTS igdb_platform_id INTEGER,
ADD COLUMN IF NOT EXISTS abbreviation TEXT;

-- Créer un index pour accélérer les recherches par igdb_platform_id
CREATE INDEX IF NOT EXISTS consoles_igdb_platform_id_idx ON consoles(igdb_platform_id);

-- Mettre à jour les permissions RLS si nécessaire
ALTER TABLE consoles ENABLE ROW LEVEL SECURITY;

-- Assurez-vous que les politiques appropriées sont en place
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'consoles' AND policyname = 'Enable read access for all users'
  ) THEN
    CREATE POLICY "Enable read access for all users" ON consoles FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'consoles' AND policyname = 'Enable insert for authenticated users only'
  ) THEN
    CREATE POLICY "Enable insert for authenticated users only" ON consoles FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'consoles' AND policyname = 'Enable update for authenticated users only'
  ) THEN
    CREATE POLICY "Enable update for authenticated users only" ON consoles FOR UPDATE 
    USING (auth.role() = 'authenticated');
  END IF;
END $$;
