-- Créer le bucket 'images' pour le stockage des images (icônes de ranks, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true, -- public pour permettre l'accès aux URLs publiques
  5242880, -- 5MB limite par fichier
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'] -- types MIME autorisés
);

-- Politique pour permettre aux admins d'uploader des images
CREATE POLICY "Admins can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Politique pour permettre aux utilisateurs authentifiés de voir les images
CREATE POLICY "Authenticated users can view images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'images');

-- Politique pour permettre aux admins de supprimer des images
CREATE POLICY "Admins can delete images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'images'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);
