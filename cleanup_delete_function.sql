-- Script pour nettoyer la fonction delete_user_data qui n'est plus utilisée
-- Cette fonction doit être exécutée en tant qu'administrateur de la base de données

-- 1. Révoker toutes les permissions de la fonction
REVOKE ALL ON FUNCTION delete_user_data(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION delete_user_data(UUID) FROM authenticated;
REVOKE ALL ON FUNCTION delete_user_data(UUID) FROM anon;

-- 2. Supprimer la fonction
DROP FUNCTION IF EXISTS delete_user_data(UUID);

-- 3. Vérifier que la fonction a été supprimée
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name = 'delete_user_data' 
  AND routine_schema = 'public';

-- Si aucun résultat n'est retourné, la fonction a été supprimée avec succès
