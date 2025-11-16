-- ============================================
-- MIGRATION: Mettre à jour les triggers pour utiliser is_dismissed
-- ============================================
-- Les triggers utilisent encore dismissed_at au lieu de is_dismissed
-- Cette migration les met à jour pour utiliser les booléens

-- 1. METTRE À JOUR auto_create_wishlist_notification
-- ============================================
CREATE OR REPLACE FUNCTION auto_create_wishlist_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Si buy passe à true (de false ou null)
  IF NEW.buy = true AND (OLD.buy IS NULL OR OLD.buy = false) THEN
    -- Créer la notification avec user_game_id et les booléens
    INSERT INTO notifications (user_id, type, user_game_id, is_read, is_dismissed)
    VALUES (NEW.user_id, 'wishlist', NEW.id, FALSE, FALSE)
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Notification wishlist créée pour user_game_id: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. METTRE À JOUR auto_dismiss_wishlist_notification
-- ============================================
CREATE OR REPLACE FUNCTION auto_dismiss_wishlist_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Si buy passe à false (de true)
  IF NEW.buy = false AND OLD.buy = true THEN
    -- Dismiss toutes les notifications associées avec is_dismissed
    UPDATE notifications 
    SET is_dismissed = TRUE, dismissed_at = NOW()
    WHERE user_game_id = NEW.id 
      AND type = 'wishlist'
      AND is_dismissed = FALSE;
    
    RAISE NOTICE 'Notifications wishlist dismissed pour user_game_id: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Les triggers existent déjà, pas besoin de les recréer


