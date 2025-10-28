-- Corriger les permissions de la fonction delete_user_data
-- Cette fonction doit être exécutée en tant qu'administrateur de la base de données

-- 1. S'assurer que la fonction existe et est correcte
CREATE OR REPLACE FUNCTION delete_user_data(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Supprimer les données dans l'ordre inverse des dépendances
  
  -- 1. Supprimer les tentatives de quiz
  DELETE FROM quiz_attempts WHERE user_id = delete_user_data.user_id;
  
  -- 2. Supprimer les récompenses utilisateur
  DELETE FROM user_rewards WHERE user_id = delete_user_data.user_id;
  
  -- 3. Supprimer les statistiques utilisateur
  DELETE FROM user_stats WHERE user_id = delete_user_data.user_id;
  
  -- 4. Supprimer les jeux de l'utilisateur
  DELETE FROM user_games WHERE user_id = delete_user_data.user_id;
  
  -- 5. Supprimer le profil utilisateur
  DELETE FROM profiles WHERE id = delete_user_data.user_id;
  
  -- Note: auth.users sera supprimé par Supabase Auth automatiquement
  -- après la déconnexion de l'utilisateur
END;
$$;

-- 2. Donner les permissions nécessaires
-- Révoker d'abord les permissions existantes
REVOKE ALL ON FUNCTION delete_user_data(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION delete_user_data(UUID) FROM authenticated;
REVOKE ALL ON FUNCTION delete_user_data(UUID) FROM anon;

-- Donner les permissions à authenticated
GRANT EXECUTE ON FUNCTION delete_user_data(UUID) TO authenticated;

-- 3. Vérifier les permissions
SELECT 
  routine_name,
  routine_type,
  security_type,
  is_deterministic
FROM information_schema.routines 
WHERE routine_name = 'delete_user_data' 
  AND routine_schema = 'public';

-- 4. Vérifier les permissions accordées
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'delete_user_data' 
  AND table_schema = 'public';
