-- Fonction pour supprimer uniquement les données utilisateur (sans supprimer auth.users)
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

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION delete_user_data(UUID) TO authenticated;
