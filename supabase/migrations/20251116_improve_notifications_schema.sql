-- ============================================
-- MIGRATION: Amélioration du schéma notifications
-- ============================================
-- Remplace le champ polymorphique reference_id par des champs spécifiques
-- avec contraintes FOREIGN KEY pour une meilleure intégrité référentielle

-- 1. AJOUTER LES NOUVEAUX CHAMPS
-- ============================================
ALTER TABLE notifications 
  ADD COLUMN IF NOT EXISTS user_game_id UUID NULL REFERENCES user_games(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS user_achievement_id UUID NULL REFERENCES user_achievements(id) ON DELETE CASCADE;

-- 2. MIGRER LES DONNÉES EXISTANTES
-- ============================================
-- Copier reference_id vers le bon champ selon le type (si reference_id existe)
DO $$
BEGIN
  -- Vérifier si la colonne reference_id existe
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'notifications' 
      AND column_name = 'reference_id'
  ) THEN
    -- Migrer les données wishlist
    UPDATE notifications 
    SET user_game_id = reference_id 
    WHERE type = 'wishlist' 
      AND user_game_id IS NULL 
      AND reference_id IS NOT NULL;

    -- Migrer les données achievement
    UPDATE notifications 
    SET user_achievement_id = reference_id 
    WHERE type = 'achievement' 
      AND user_achievement_id IS NULL 
      AND reference_id IS NOT NULL;
    
    RAISE NOTICE 'Migration des données depuis reference_id terminée';
  ELSE
    RAISE NOTICE 'La colonne reference_id n''existe pas, migration des données ignorée';
  END IF;
END $$;

-- 3. AJOUTER LA CONTRAINTE CHECK
-- ============================================
-- S'assurer qu'un seul champ est non-null selon le type
ALTER TABLE notifications 
  DROP CONSTRAINT IF EXISTS check_notification_reference;

ALTER TABLE notifications 
  ADD CONSTRAINT check_notification_reference CHECK (
    (type = 'wishlist' AND user_game_id IS NOT NULL AND user_achievement_id IS NULL) OR
    (type = 'achievement' AND user_achievement_id IS NOT NULL AND user_game_id IS NULL)
  );

-- 4. CRÉER LES INDEX SUR LES NOUVEAUX CHAMPS
-- ============================================
CREATE INDEX IF NOT EXISTS idx_notifications_user_game 
  ON notifications(user_game_id) 
  WHERE user_game_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_user_achievement 
  ON notifications(user_achievement_id) 
  WHERE user_achievement_id IS NOT NULL;

-- 5. METTRE À JOUR LA CONTRAINTE UNIQUE
-- ============================================
-- Supprimer l'ancienne contrainte si elle existe
ALTER TABLE notifications 
  DROP CONSTRAINT IF EXISTS unique_notification_user_type_reference;

-- Créer une contrainte unique pour wishlist (user_id + user_game_id)
CREATE UNIQUE INDEX IF NOT EXISTS unique_notification_wishlist 
  ON notifications(user_id, user_game_id) 
  WHERE type = 'wishlist' AND dismissed_at IS NULL;

-- Créer une contrainte unique pour achievement (user_id + user_achievement_id)
CREATE UNIQUE INDEX IF NOT EXISTS unique_notification_achievement 
  ON notifications(user_id, user_achievement_id) 
  WHERE type = 'achievement' AND dismissed_at IS NULL;

-- 6. METTRE À JOUR LES TRIGGERS ET FONCTIONS
-- ============================================
-- IMPORTANT: Recréer les triggers pour utiliser les nouvelles fonctions
-- qui utilisent user_game_id au lieu de reference_id

-- Supprimer les anciens triggers s'ils existent
DROP TRIGGER IF EXISTS trigger_create_wishlist_notification ON user_games;
DROP TRIGGER IF EXISTS trigger_dismiss_wishlist_notification ON user_games;

-- Fonction: Créer automatiquement une notification wishlist quand buy = true
CREATE OR REPLACE FUNCTION auto_create_wishlist_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Si buy passe à true (de false ou null)
  IF NEW.buy = true AND (OLD.buy IS NULL OR OLD.buy = false) THEN
    -- Créer la notification avec user_game_id et les booléens
    -- Utiliser is_dismissed si disponible, sinon fallback sur dismissed_at
    INSERT INTO notifications (user_id, type, user_game_id, is_read, is_dismissed)
    VALUES (NEW.user_id, 'wishlist', NEW.id, FALSE, FALSE)
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Notification wishlist créée pour user_game_id: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction: Dismiss automatiquement la notification quand buy = false
CREATE OR REPLACE FUNCTION auto_dismiss_wishlist_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Si buy passe à false (de true)
  IF NEW.buy = false AND OLD.buy = true THEN
    -- Dismiss toutes les notifications associées
    -- Utiliser is_dismissed si disponible, sinon fallback sur dismissed_at
    UPDATE notifications 
    SET 
      is_dismissed = TRUE,
      dismissed_at = NOW()
    WHERE user_game_id = NEW.id 
      AND type = 'wishlist'
      AND (is_dismissed = FALSE OR is_dismissed IS NULL);
    
    RAISE NOTICE 'Notifications wishlist dismissed pour user_game_id: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recréer les triggers avec les nouvelles fonctions
CREATE TRIGGER trigger_create_wishlist_notification
  AFTER INSERT OR UPDATE OF buy ON user_games
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_wishlist_notification();

CREATE TRIGGER trigger_dismiss_wishlist_notification
  AFTER UPDATE OF buy ON user_games
  FOR EACH ROW
  EXECUTE FUNCTION auto_dismiss_wishlist_notification();

-- 7. SUPPRIMER L'ANCIEN CHAMP reference_id
-- ============================================
-- IMPORTANT: Les triggers et fonctions ont été mis à jour dans la section 6
-- pour utiliser user_game_id/user_achievement_id au lieu de reference_id

-- Supprimer l'index sur reference_id (s'il existe)
DROP INDEX IF EXISTS idx_notifications_reference;

-- Vérifier qu'il n'y a plus de données utilisant reference_id
-- (les données ont été migrées dans la section 2)
DO $$
DECLARE
  remaining_count INTEGER;
  column_exists BOOLEAN;
BEGIN
  -- Vérifier si la colonne reference_id existe
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'notifications' 
      AND column_name = 'reference_id'
  ) INTO column_exists;
  
  IF column_exists THEN
    SELECT COUNT(*) INTO remaining_count
    FROM notifications
    WHERE reference_id IS NOT NULL
      AND (user_game_id IS NULL AND user_achievement_id IS NULL);
    
    IF remaining_count > 0 THEN
      RAISE WARNING 'Il reste % notification(s) avec reference_id mais sans user_game_id/user_achievement_id. Migration des données incomplète.', remaining_count;
    END IF;
  END IF;
END $$;

-- Supprimer la colonne reference_id
-- Cette opération échouera si des contraintes ou triggers l'utilisent encore
ALTER TABLE notifications 
  DROP COLUMN IF EXISTS reference_id;

-- 8. COMMENTAIRES POUR DOCUMENTATION
-- ============================================
COMMENT ON COLUMN notifications.user_game_id IS 'ID du user_game pour les notifications wishlist. NULL pour les achievements.';
COMMENT ON COLUMN notifications.user_achievement_id IS 'ID du user_achievement pour les notifications achievement. NULL pour les wishlist.';

