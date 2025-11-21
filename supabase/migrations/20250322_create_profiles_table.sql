-- Création de la table profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Créer des policies pour restreindre l'accès
CREATE POLICY "Les profils peuvent être lus par tout utilisateur authentifié" 
ON public.profiles FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Les utilisateurs peuvent insérer leur propre profil" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Fonction pour créer un profil à l'inscription
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

-- Déclencher la création de profil à chaque nouvel utilisateur
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
