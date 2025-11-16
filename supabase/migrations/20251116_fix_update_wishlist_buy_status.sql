-- ============================================
-- MIGRATION: Mise à jour de la fonction update_wishlist_buy_status
-- ============================================
-- Cette fonction est appelée par l'API /api/wishlist/buy (avec token)
-- Elle doit maintenant utiliser la nouvelle table 'notifications' au lieu de 'wishlist_notifications'

CREATE OR REPLACE FUNCTION public.update_wishlist_buy_status(
  p_token TEXT,
  p_user_game_id UUID,
  p_buy BOOLEAN
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_game_user_id UUID;
  v_status TEXT;
BEGIN
  -- Vérifier que le token existe et est actif
  SELECT user_id INTO v_user_id
  FROM public.wishlist_shares
  WHERE token = p_token
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW());
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Token invalide ou expiré';
  END IF;
  
  -- Vérifier que le jeu appartient à l'utilisateur du token et est en wishlist
  SELECT user_id, status INTO v_game_user_id, v_status
  FROM public.user_games
  WHERE id = p_user_game_id;
  
  IF v_game_user_id IS NULL THEN
    RAISE EXCEPTION 'Jeu non trouvé';
  END IF;
  
  IF v_game_user_id != v_user_id THEN
    RAISE EXCEPTION 'Ce jeu n''appartient pas à cette wishlist';
  END IF;
  
  IF v_status != 'WISHLIST' AND v_status != 'wishlist' THEN
    RAISE EXCEPTION 'Ce jeu n''est pas en wishlist';
  END IF;
  
  -- Mettre à jour uniquement le champ buy
  -- Les triggers SQL vont automatiquement créer/dismiss les notifications
  UPDATE public.user_games
  SET buy = p_buy, updated_at = NOW()
  WHERE id = p_user_game_id;
  
  -- Les notifications sont maintenant gérées automatiquement par les triggers SQL
  -- qui utilisent la nouvelle table 'notifications' avec user_game_id
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Donner les permissions d'exécution
GRANT EXECUTE ON FUNCTION public.update_wishlist_buy_status(TEXT, UUID, BOOLEAN) TO anon, authenticated;


