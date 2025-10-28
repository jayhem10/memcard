-- Fonction pour supprimer toutes les données d'un utilisateur
CREATE OR REPLACE FUNCTION delete_user_data(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Supprimer les données dans l'ordre pour respecter les contraintes de clé étrangère
  
  -- 1. Supprimer les jeux de la collection
  DELETE FROM public.user_games WHERE user_id = delete_user_data.user_id;
  
  -- 2. Supprimer les statistiques utilisateur
  DELETE FROM public.user_stats WHERE user_id = delete_user_data.user_id;
  
  -- 3. Supprimer les récompenses utilisateur
  DELETE FROM public.user_rewards WHERE user_id = delete_user_data.user_id;
  
  -- 4. Supprimer les quiz complétés
  DELETE FROM public.quiz_attempts WHERE user_id = delete_user_data.user_id;
  
  -- 5. Supprimer le profil utilisateur
  DELETE FROM public.profiles WHERE id = delete_user_data.user_id;
  
  -- 6. Supprimer l'utilisateur de l'auth
  DELETE FROM auth.users WHERE id = delete_user_data.user_id;
  
END;
$$;

-- Fonction pour supprimer un utilisateur (appelée depuis l'API)
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Récupérer l'ID de l'utilisateur actuel
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifié';
  END IF;
  
  -- Supprimer toutes les données de l'utilisateur
  PERFORM delete_user_data(current_user_id);
  
END;
$$;

-- RLS pour permettre à l'utilisateur de supprimer ses propres données
GRANT EXECUTE ON FUNCTION delete_user_account() TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_data(UUID) TO authenticated;
