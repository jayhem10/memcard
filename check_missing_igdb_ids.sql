-- Script pour vérifier les plateformes sans igdb_platform_id
-- À exécuter dans l'interface SQL de Supabase

-- Voir toutes les plateformes et leur igdb_platform_id
SELECT 
  id,
  name,
  igdb_platform_id,
  abbreviation,
  release_year,
  CASE 
    WHEN igdb_platform_id IS NULL THEN 'NULL'
    WHEN igdb_platform_id = 0 THEN 'ZERO'
    ELSE 'VALID'
  END as status
FROM consoles 
ORDER BY name;

-- Compter les plateformes par statut
SELECT 
  CASE 
    WHEN igdb_platform_id IS NULL THEN 'NULL'
    WHEN igdb_platform_id = 0 THEN 'ZERO'
    ELSE 'VALID'
  END as status,
  COUNT(*) as count
FROM consoles 
GROUP BY 
  CASE 
    WHEN igdb_platform_id IS NULL THEN 'NULL'
    WHEN igdb_platform_id = 0 THEN 'ZERO'
    ELSE 'VALID'
  END;

-- Voir les plateformes problématiques
SELECT 
  id,
  name,
  igdb_platform_id,
  abbreviation
FROM consoles 
WHERE igdb_platform_id IS NULL 
   OR igdb_platform_id = 0
ORDER BY name;
