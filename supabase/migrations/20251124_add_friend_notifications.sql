-- ============================================
-- MIGRATION: Ajouter les notifications d'amis
-- ============================================
-- Cette migration ajoute le support des notifications d'amis
-- au système de notifications unifié

-- 1. AJOUTER LA COLONNE friend_id
-- ============================================
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS friend_id UUID NULL REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. CRÉER L'INDEX POUR friend_id
-- ============================================
CREATE INDEX IF NOT EXISTS idx_notifications_friend
  ON notifications(friend_id)
  WHERE friend_id IS NOT NULL;

-- 3. METTRE À JOUR LA CONTRAINTE CHECK
-- ============================================
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS check_notification_reference;

ALTER TABLE notifications
ADD CONSTRAINT check_notification_reference CHECK (
  (type = 'wishlist' AND user_game_id IS NOT NULL AND user_achievement_id IS NULL AND friend_id IS NULL) OR
  (type = 'achievement' AND user_achievement_id IS NOT NULL AND user_game_id IS NULL AND friend_id IS NULL) OR
  (type = 'friend' AND friend_id IS NOT NULL AND user_game_id IS NULL AND user_achievement_id IS NULL)
);

-- 4. AJOUTER LA CONTRAINTE UNIQUE POUR LES NOTIFICATIONS D'AMIS
-- ============================================
-- Une notification par ami ajouté (éviter les doublons)
CREATE UNIQUE INDEX IF NOT EXISTS unique_notification_friend
  ON notifications(user_id, friend_id)
  WHERE type = 'friend' AND is_dismissed = FALSE;

-- 5. METTRE À JOUR LES COMMENTAIRES
-- ============================================
COMMENT ON COLUMN notifications.friend_id IS 'ID de l''utilisateur qui a ajouté en ami pour les notifications friend. NULL pour les autres types.';
COMMENT ON COLUMN notifications.type IS 'Type de notification: wishlist, achievement, friend';

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================
