-- ============================================
-- MIGRATION: Corriger les fonctions de notifications
-- ============================================
-- Cette migration corrige les fonctions qui utilisent encore les anciens champs
-- ou l'ancienne table wishlist_notifications

-- 1. CORRIGER dismiss_notification pour utiliser is_dismissed
-- ============================================
CREATE OR REPLACE FUNCTION dismiss_notification(notification_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE notifications
  SET 
    is_dismissed = TRUE,
    dismissed_at = NOW()
  WHERE id = notification_id
    AND user_id = auth.uid()
    AND is_dismissed = FALSE; -- Ne mettre à jour que si pas déjà dismissed
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. CORRIGER mark_notification_as_read pour utiliser is_read
-- ============================================
CREATE OR REPLACE FUNCTION mark_notification_as_read(notification_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE notifications
  SET 
    is_read = TRUE,
    read_at = NOW()
  WHERE id = notification_id
    AND user_id = auth.uid()
    AND is_read = FALSE; -- Ne mettre à jour que si pas déjà lu
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. CORRIGER auto_dismiss_wishlist_notification
-- ============================================
-- La condition (is_dismissed = FALSE OR is_dismissed IS NULL) n'est pas nécessaire
-- car is_dismissed est NOT NULL DEFAULT FALSE
CREATE OR REPLACE FUNCTION auto_dismiss_wishlist_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Si buy passe à false (de true)
  IF NEW.buy = false AND OLD.buy = true THEN
    -- Dismiss toutes les notifications associées
    UPDATE notifications 
    SET 
      is_dismissed = TRUE,
      dismissed_at = NOW()
    WHERE user_game_id = NEW.id 
      AND type = 'wishlist'
      AND is_dismissed = FALSE; -- Seulement si pas déjà dismissed
    
    RAISE NOTICE 'Notifications wishlist dismissed pour user_game_id: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. VÉRIFIER ET SUPPRIMER L'ANCIENNE FONCTION create_wishlist_notifications
-- ============================================
-- Cette fonction insère dans l'ancienne table wishlist_notifications
-- Elle ne devrait plus être utilisée
DROP FUNCTION IF EXISTS create_wishlist_notifications(UUID) CASCADE;

-- 5. VÉRIFIER LES GRANTS
-- ============================================
GRANT EXECUTE ON FUNCTION dismiss_notification(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_as_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION auto_dismiss_wishlist_notification() TO authenticated;

-- 6. COMMENTAIRES
-- ============================================
COMMENT ON FUNCTION dismiss_notification(UUID) IS 'Dismiss une notification en mettant is_dismissed = TRUE';
COMMENT ON FUNCTION mark_notification_as_read(UUID) IS 'Marque une notification comme lue en mettant is_read = TRUE';

