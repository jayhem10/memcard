-- Corriger les politiques RLS pour éviter la récursion infinie

-- Supprimer toutes les politiques existantes sur la table profiles
DROP POLICY IF EXISTS "Les profils peuvent être lus par tout utilisateur authentifié" ON public.profiles;
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leur propre profil" ON public.profiles;
DROP POLICY IF EXISTS "Les utilisateurs peuvent insérer leur propre profil" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;

-- Recréer les politiques de manière simple et sans récursion
CREATE POLICY "Authenticated users can read profiles" 
ON public.profiles FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

-- Politique pour les admins (ils peuvent voir tous les profils)
-- Cette politique sera gérée côté application, pas côté RLS pour éviter la récursion
