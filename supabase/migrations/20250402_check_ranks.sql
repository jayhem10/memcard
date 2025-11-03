-- Script pour vérifier les ranks existants dans la base de données
-- Exécutez ce script dans Supabase SQL Editor pour voir tous les ranks

SELECT 
  id,
  name_en,
  name_fr,
  level,
  description_en,
  description_fr,
  created_at
FROM public.ranks
ORDER BY level, name_en;

-- Si vous voulez voir quels ranks sont assignés aux utilisateurs :
SELECT 
  p.id as user_id,
  p.username,
  r.name_en,
  r.name_fr,
  r.level
FROM public.profiles p
LEFT JOIN public.ranks r ON p.rank_id = r.id
WHERE p.rank_id IS NOT NULL
ORDER BY r.level, r.name_en;


