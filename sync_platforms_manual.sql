-- Script pour synchroniser manuellement les plateformes avec IGDB
-- À exécuter dans l'interface SQL de Supabase

-- D'abord, vérifier les plateformes manquantes
WITH missing_platforms AS (
  SELECT id, name
  FROM consoles 
  WHERE igdb_platform_id IS NULL 
     OR igdb_platform_id = 0
     OR igdb_platform_id = 999
)
SELECT 
  'Plateformes à synchroniser:' as info,
  COUNT(*) as count
FROM missing_platforms;

-- Afficher les plateformes manquantes
SELECT 
  id,
  name,
  'Besoin de synchronisation IGDB' as action
FROM consoles 
WHERE igdb_platform_id IS NULL 
   OR igdb_platform_id = 0
   OR igdb_platform_id = 999
ORDER BY name;

-- Optionnel : Supprimer les plateformes sans ID IGDB valide
-- ATTENTION : Cela supprimera définitivement les plateformes !
-- Décommentez seulement si vous êtes sûr
/*
DELETE FROM consoles 
WHERE igdb_platform_id IS NULL 
   OR igdb_platform_id = 0
   OR igdb_platform_id = 999;
*/
