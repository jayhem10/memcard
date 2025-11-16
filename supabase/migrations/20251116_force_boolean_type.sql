-- ============================================
-- MIGRATION: Forcer le type BOOLEAN pour is_read et is_dismissed
-- ============================================
-- Certaines valeurs sont stockées comme chaînes 'false'/'true' au lieu de booléens
-- Cette migration force le type BOOLEAN et corrige toutes les valeurs

-- 1. FORCER LE TYPE DE COLONNE À BOOLEAN
-- ============================================
-- Utiliser ALTER COLUMN avec USING pour convertir toutes les valeurs en booléens
-- Cela garantit que le type de colonne est bien BOOLEAN, pas TEXT ou autre

ALTER TABLE notifications
ALTER COLUMN is_read TYPE BOOLEAN USING (
  CASE 
    WHEN is_read::text IN ('true', 't', '1', 'TRUE') THEN TRUE
    WHEN is_read::text IN ('false', 'f', '0', 'FALSE') THEN FALSE
    WHEN is_read IS NULL THEN FALSE
    ELSE FALSE
  END
);

ALTER TABLE notifications
ALTER COLUMN is_dismissed TYPE BOOLEAN USING (
  CASE 
    WHEN is_dismissed::text IN ('true', 't', '1', 'TRUE') THEN TRUE
    WHEN is_dismissed::text IN ('false', 'f', '0', 'FALSE') THEN FALSE
    WHEN is_dismissed IS NULL THEN FALSE
    ELSE FALSE
  END
);

-- S'assurer que les colonnes ont des valeurs par défaut et NOT NULL
ALTER TABLE notifications
ALTER COLUMN is_read SET DEFAULT FALSE,
ALTER COLUMN is_read SET NOT NULL;

ALTER TABLE notifications
ALTER COLUMN is_dismissed SET DEFAULT FALSE,
ALTER COLUMN is_dismissed SET NOT NULL;

-- 2. VÉRIFIER QUE LES COLONNES SONT BIEN DE TYPE BOOLEAN
-- ============================================
DO $$
DECLARE
  read_type TEXT;
  dismissed_type TEXT;
BEGIN
  SELECT data_type INTO read_type
  FROM information_schema.columns
  WHERE table_name = 'notifications' AND column_name = 'is_read';
  
  SELECT data_type INTO dismissed_type
  FROM information_schema.columns
  WHERE table_name = 'notifications' AND column_name = 'is_dismissed';
  
  IF read_type != 'boolean' THEN
    RAISE WARNING 'is_read est de type % au lieu de boolean', read_type;
  END IF;
  
  IF dismissed_type != 'boolean' THEN
    RAISE WARNING 'is_dismissed est de type % au lieu de boolean', dismissed_type;
  ELSE
    RAISE NOTICE '✅ Les colonnes sont bien de type boolean';
  END IF;
END $$;

-- 3. VÉRIFIER LES VALEURS APRÈS CORRECTION
-- ============================================
DO $$
DECLARE
  bad_read_count INTEGER;
  bad_dismissed_count INTEGER;
BEGIN
  -- Compter les valeurs qui ne sont pas des booléens valides
  SELECT COUNT(*) INTO bad_read_count
  FROM notifications
  WHERE is_read IS NOT NULL
    AND is_read::text NOT IN ('true', 'false', 't', 'f', '1', '0');
  
  SELECT COUNT(*) INTO bad_dismissed_count
  FROM notifications
  WHERE is_dismissed IS NOT NULL
    AND is_dismissed::text NOT IN ('true', 'false', 't', 'f', '1', '0');
  
  IF bad_read_count > 0 OR bad_dismissed_count > 0 THEN
    RAISE WARNING 'Il reste % notification(s) avec is_read incorrect et % avec is_dismissed incorrect', 
      bad_read_count, bad_dismissed_count;
  ELSE
    RAISE NOTICE '✅ Toutes les valeurs booléennes ont été corrigées';
  END IF;
END $$;

