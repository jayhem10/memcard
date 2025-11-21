-- Script SQL pour corriger le problème d'authentification Google
-- À exécuter dans le SQL Editor de Supabase

-- Mettre à jour la fonction handle_new_user pour gérer les conflits de username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 1;
BEGIN
  -- Utiliser la partie avant @ de l'email comme base
  base_username := SPLIT_PART(NEW.email, '@', 1);

  -- Essayer d'abord avec le username de base
  final_username := base_username;

  -- Si le username existe déjà, ajouter un suffixe numérique
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || '_' || counter::TEXT;
  END LOOP;

  INSERT INTO public.profiles (id, username, full_name, avatar_url, updated_at)
  VALUES (
    NEW.id,
    final_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', base_username),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Message de confirmation
SELECT '✅ Fonction handle_new_user mise à jour pour gérer les conflits de username' as status;
