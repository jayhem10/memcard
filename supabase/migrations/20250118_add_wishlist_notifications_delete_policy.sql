-- Ajouter la permission DELETE pour wishlist_notifications
GRANT DELETE ON public.wishlist_notifications TO authenticated;

-- Policy pour permettre aux utilisateurs de supprimer leurs propres notifications
DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer leurs propres notifications" ON public.wishlist_notifications;
CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres notifications" 
ON public.wishlist_notifications FOR DELETE 
USING (auth.uid() = user_id);

