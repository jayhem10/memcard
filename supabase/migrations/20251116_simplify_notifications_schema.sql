-- ============================================
-- MIGRATION: Simplifier le schéma des notifications
-- ============================================
-- Remplacer read_at (TIMESTAMPTZ NULL) par is_read (BOOLEAN)
-- Remplacer dismissed_at (TIMESTAMPTZ NULL) par is_dismissed (BOOLEAN)
-- Plus simple à utiliser et éviter les problèmes avec NULL

-- 1. AJOUTER LES NOUVEAUX CHAMPS BOOLÉENS
-- ============================================
ALTER TABLE notifications 
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_dismissed BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. MIGRER LES DONNÉES EXISTANTES
-- ============================================
-- Convertir read_at NULL → is_read FALSE, read_at NOT NULL → is_read TRUE
UPDATE notifications 
SET is_read = CASE 
  WHEN read_at IS NOT NULL THEN TRUE 
  ELSE FALSE 
END;

-- Convertir dismissed_at NULL → is_dismissed FALSE, dismissed_at NOT NULL → is_dismissed TRUE
UPDATE notifications 
SET is_dismissed = CASE 
  WHEN dismissed_at IS NOT NULL THEN TRUE 
  ELSE FALSE 
END;

-- 3. CRÉER LES INDEX SUR LES NOUVEAUX CHAMPS
-- ============================================
CREATE INDEX IF NOT EXISTS idx_notifications_is_dismissed 
  ON notifications(user_id, created_at DESC) 
  WHERE is_dismissed = FALSE;

CREATE INDEX IF NOT EXISTS idx_notifications_is_read 
  ON notifications(user_id, is_read) 
  WHERE is_dismissed = FALSE;

-- 4. METTRE À JOUR LES TRIGGERS ET FONCTIONS
-- ============================================
-- Mettre à jour la fonction auto_create_wishlist_notification pour utiliser is_dismissed
CREATE OR REPLACE FUNCTION auto_create_wishlist_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Si buy passe à true (de false ou null)
  IF NEW.buy = true AND (OLD.buy IS NULL OR OLD.buy = false) THEN
    -- Créer la notification avec user_game_id
    INSERT INTO notifications (user_id, type, user_game_id, is_read, is_dismissed)
    VALUES (NEW.user_id, 'wishlist', NEW.id, FALSE, FALSE)
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Notification wishlist créée pour user_game_id: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mettre à jour la fonction auto_dismiss_wishlist_notification pour utiliser is_dismissed
CREATE OR REPLACE FUNCTION auto_dismiss_wishlist_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Si buy passe à false (de true)
  IF NEW.buy = false AND OLD.buy = true THEN
    -- Dismiss toutes les notifications associées
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

-- 5. SUPPRIMER LES ANCIENS CHAMPS (OPTIONNEL)
-- ============================================
-- Les dates read_at et dismissed_at peuvent être supprimées si on n'a pas besoin d'historique
-- Pour l'instant, on les garde pour la compatibilité avec l'ancien code
-- Pour supprimer plus tard :
-- ALTER TABLE notifications DROP COLUMN IF EXISTS read_at;
-- ALTER TABLE notifications DROP COLUMN IF EXISTS dismissed_at;

-- 6. COMMENTAIRES POUR DOCUMENTATION
-- ============================================
COMMENT ON COLUMN notifications.is_read IS 'Indique si la notification a été lue (TRUE) ou non (FALSE)';
COMMENT ON COLUMN notifications.is_dismissed IS 'Indique si la notification a été dismissée (TRUE) ou est active (FALSE)';

