-- ============================================
-- MIGRATION: Fonction RPC pour créer des notifications d'amis
-- ============================================
-- Cette fonction permet de créer des notifications d'amis de manière sécurisée
-- sans avoir à utiliser le service role key côté client

-- Créer la fonction RPC
CREATE OR REPLACE FUNCTION create_friend_notification(friend_user_id UUID, adder_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insérer la notification (les RLS sont contournées car c'est SECURITY DEFINER)
  INSERT INTO notifications (user_id, type, friend_id)
  VALUES (friend_user_id, 'friend', adder_user_id);

  -- Log pour débogage
  RAISE NOTICE 'Notification ami créée: friend_user_id=%, adder_user_id=%', friend_user_id, adder_user_id;
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION create_friend_notification(UUID, UUID) TO authenticated;

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================
