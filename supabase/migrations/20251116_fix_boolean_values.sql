-- ============================================
-- MIGRATION: Corriger les valeurs booléennes stockées comme chaînes
-- ============================================
-- Certaines valeurs is_read et is_dismissed sont stockées comme 'false'/'true' (chaînes)
-- au lieu de FALSE/TRUE (booléens). Cette migration les corrige.

-- 1. CORRIGER is_read
-- ============================================
UPDATE notifications 
SET is_read = CASE 
  WHEN is_read::text = 'true' OR is_read::text = 't' THEN TRUE
  WHEN is_read::text = 'false' OR is_read::text = 'f' THEN FALSE
  ELSE is_read::boolean
END
WHERE is_read IS NOT NULL;

-- Alternative si le cast direct ne fonctionne pas
UPDATE notifications 
SET is_read = TRUE
WHERE is_read::text IN ('true', 't', '1');

UPDATE notifications 
SET is_read = FALSE
WHERE is_read::text IN ('false', 'f', '0');

-- 2. CORRIGER is_dismissed
-- ============================================
UPDATE notifications 
SET is_dismissed = TRUE
WHERE is_dismissed::text IN ('true', 't', '1');

UPDATE notifications 
SET is_dismissed = FALSE
WHERE is_dismissed::text IN ('false', 'f', '0');

-- 3. VÉRIFIER LES RÉSULTATS
-- ============================================
-- Compter les notifications avec des valeurs incorrectes
DO $$
DECLARE
  bad_read_count INTEGER;
  bad_dismissed_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO bad_read_count
  FROM notifications
  WHERE is_read::text NOT IN ('true', 'false', 't', 'f', '1', '0')
    AND is_read IS NOT NULL;
  
  SELECT COUNT(*) INTO bad_dismissed_count
  FROM notifications
  WHERE is_dismissed::text NOT IN ('true', 'false', 't', 'f', '1', '0')
    AND is_dismissed IS NOT NULL;
  
  IF bad_read_count > 0 OR bad_dismissed_count > 0 THEN
    RAISE WARNING 'Il reste % notification(s) avec is_read incorrect et % avec is_dismissed incorrect', 
      bad_read_count, bad_dismissed_count;
  ELSE
    RAISE NOTICE '✅ Toutes les valeurs booléennes ont été corrigées';
  END IF;
END $$;


