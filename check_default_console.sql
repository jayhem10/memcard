-- Script pour vérifier la console par défaut
-- À exécuter dans l'interface SQL de Supabase

-- Vérifier si la console par défaut existe
SELECT 
  id,
  name,
  igdb_platform_id,
  abbreviation,
  release_year,
  created_at
FROM consoles 
WHERE id = '0671dd4a-b560-4aec-8552-57baae9514bd'
   OR name = 'Console par défaut';

-- Vérifier combien de jeux utilisent cette console
SELECT 
  'Jeux utilisant cette console:' as info,
  COUNT(*) as count
FROM user_games ug
JOIN games g ON ug.game_id = g.id
WHERE g.console_id = '0671dd4a-b560-4aec-8552-57baae9514bd';

-- Voir les jeux qui utilisent cette console
SELECT 
  g.title,
  g.developer,
  ug.status,
  ug.created_at
FROM user_games ug
JOIN games g ON ug.game_id = g.id
WHERE g.console_id = '0671dd4a-b560-4aec-8552-57baae9514bd'
ORDER BY ug.created_at DESC
LIMIT 10;

-- Vérifier toutes les consoles "par défaut" ou similaires
SELECT 
  id,
  name,
  igdb_platform_id,
  abbreviation,
  created_at
FROM consoles 
WHERE name ILIKE '%défaut%' 
   OR name ILIKE '%default%'
   OR igdb_platform_id IS NULL
ORDER BY created_at DESC;
