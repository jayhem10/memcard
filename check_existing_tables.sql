-- Vérifier quelles tables existent dans la base de données
SELECT 
  table_name,
  table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%user%' 
  OR table_name LIKE '%quiz%'
  OR table_name LIKE '%profile%'
ORDER BY table_name;
