-- Fonction pour créer la fonction add_columns_to_consoles
CREATE OR REPLACE FUNCTION create_add_columns_function() 
RETURNS void AS $$
BEGIN
  -- Vérifier si la fonction existe déjà
  IF NOT EXISTS (
    SELECT FROM pg_proc
    WHERE proname = 'add_columns_to_consoles'
  ) THEN
    -- Créer la fonction
    EXECUTE '
      CREATE OR REPLACE FUNCTION add_columns_to_consoles() 
      RETURNS void AS $func$
      BEGIN
        -- Ajouter la colonne igdb_platform_id si elle n''existe pas
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = ''consoles'' AND column_name = ''igdb_platform_id''
        ) THEN
          ALTER TABLE consoles ADD COLUMN igdb_platform_id INTEGER;
        END IF;

        -- Ajouter la colonne abbreviation si elle n''existe pas
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = ''consoles'' AND column_name = ''abbreviation''
        ) THEN
          ALTER TABLE consoles ADD COLUMN abbreviation TEXT;
        END IF;

        -- Créer un index pour accélérer les recherches
        IF NOT EXISTS (
          SELECT FROM pg_indexes
          WHERE indexname = ''consoles_igdb_platform_id_idx''
        ) THEN
          CREATE INDEX consoles_igdb_platform_id_idx ON consoles(igdb_platform_id);
        END IF;
      END;
      $func$ LANGUAGE plpgsql;
    ';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Exécuter la fonction pour créer add_columns_to_consoles
SELECT create_add_columns_function();
