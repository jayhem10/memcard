-- Activer RLS sur la table consoles
ALTER TABLE public.consoles ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Enable read access for all users" ON public.consoles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.consoles;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.consoles;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.consoles;

-- Grant permissions de base
GRANT SELECT ON public.consoles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.consoles TO authenticated;

-- Politique de lecture : Tous les utilisateurs (authentifiés et anonymes) peuvent lire toutes les consoles
-- C'est nécessaire pour permettre la sélection de consoles lors de l'ajout de jeux
CREATE POLICY "Tous les utilisateurs peuvent lire les consoles"
ON public.consoles FOR SELECT
TO anon, authenticated
USING (true);

-- Politique d'insertion : Seuls les administrateurs peuvent ajouter des consoles
-- Utilisée lors de la synchronisation des plateformes IGDB
CREATE POLICY "Seuls les administrateurs peuvent ajouter des consoles"
ON public.consoles FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Politique de mise à jour : Seuls les administrateurs peuvent modifier les consoles
-- Utilisée lors de la synchronisation des plateformes IGDB pour mettre à jour les igdb_platform_id
CREATE POLICY "Seuls les administrateurs peuvent modifier les consoles"
ON public.consoles FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Politique de suppression : Seuls les administrateurs peuvent supprimer des consoles
CREATE POLICY "Seuls les administrateurs peuvent supprimer les consoles"
ON public.consoles FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

