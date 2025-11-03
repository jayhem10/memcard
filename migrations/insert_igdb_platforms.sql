-- Cette commande SQL permet d'ajouter les plateformes IGDB directement en base de données
-- Il est recommandé de l'exécuter directement dans l'interface SQL de Supabase

-- Créer une fonction pour ajouter les colonnes requises si nécessaire
CREATE OR REPLACE FUNCTION setup_igdb_platforms() 
RETURNS void AS $$
BEGIN
  -- Vérifier si la colonne igdb_platform_id existe, sinon l'ajouter
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'consoles' AND column_name = 'igdb_platform_id'
  ) THEN
    ALTER TABLE consoles ADD COLUMN igdb_platform_id INTEGER;
  END IF;

  -- Vérifier si la colonne abbreviation existe, sinon l'ajouter
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'consoles' AND column_name = 'abbreviation'
  ) THEN
    ALTER TABLE consoles ADD COLUMN abbreviation TEXT;
  END IF;
  
  -- Créer un index pour accélérer les recherches
  IF NOT EXISTS (
    SELECT FROM pg_indexes
    WHERE indexname = 'consoles_igdb_platform_id_idx'
  ) THEN
    CREATE INDEX consoles_igdb_platform_id_idx ON consoles(igdb_platform_id);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Exécuter la fonction pour s'assurer que les colonnes existent
SELECT setup_igdb_platforms();

-- Insérer les principales plateformes IGDB directement dans la table consoles
-- Désactiver temporairement RLS pour cette opération (à exécuter en tant qu'administrateur)
ALTER TABLE consoles DISABLE ROW LEVEL SECURITY;

-- Insérer quelques plateformes populaires avec leur ID IGDB correspondant
-- Ces données sont maintenues manuellement et représentent les plateformes les plus courantes
INSERT INTO consoles (name, igdb_platform_id, abbreviation, release_year)
VALUES 
  ('PlayStation 5', 167, 'PS5', 2020),
  ('PlayStation 4', 48, 'PS4', 2013),
  ('PlayStation 3', 9, 'PS3', 2006),
  ('PlayStation 2', 8, 'PS2', 2000),
  ('PlayStation', 7, 'PS1', 1994),
  ('Xbox Series X|S', 169, 'XSX', 2020),
  ('Xbox One', 49, 'XB1', 2013),
  ('Xbox 360', 12, 'X360', 2005),
  ('Xbox', 11, 'XBOX', 2001),
  ('Nintendo Switch', 130, 'Switch', 2017),
  ('Nintendo Wii U', 41, 'Wii U', 2012),
  ('Nintendo Wii', 5, 'Wii', 2006),
  ('Nintendo GameCube', 21, 'GC', 2001),
  ('Nintendo 64', 4, 'N64', 1996),
  ('Super Nintendo', 19, 'SNES', 1990),
  ('Nintendo Entertainment System', 18, 'NES', 1983),
  ('Nintendo 3DS', 37, '3DS', 2011),
  ('Nintendo DS', 20, 'DS', 2004),
  ('Game Boy Advance', 24, 'GBA', 2001),
  ('Game Boy Color', 22, 'GBC', 1998),
  ('Game Boy', 33, 'GB', 1989),
  ('PC', 6, 'PC', 1980),
  ('Sega Dreamcast', 23, 'DC', 1998),
  ('Sega Saturn', 32, 'Saturn', 1994),
  ('Sega Genesis', 29, 'Genesis', 1988),
  ('Sega Master System', 64, 'SMS', 1985),
  ('Atari 2600', 59, '2600', 1977)
ON CONFLICT (igdb_platform_id) 
DO UPDATE SET 
  name = EXCLUDED.name,
  abbreviation = EXCLUDED.abbreviation;

-- Réactiver RLS
ALTER TABLE consoles ENABLE ROW LEVEL SECURITY;
