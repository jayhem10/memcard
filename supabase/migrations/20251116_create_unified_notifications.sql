-- ============================================
-- MIGRATION: Système de notifications unifié
-- ============================================
-- Cette migration crée une table unique pour toutes les notifications
-- et migre les données existantes depuis wishlist_notifications et achievement_notifications

-- 1. CRÉER LA NOUVELLE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('wishlist', 'achievement', 'friend')),
  reference_id UUID NOT NULL, -- user_game_id pour wishlist, user_achievement_id pour achievement
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ NULL, -- NULL = non lu, sinon date de lecture
  dismissed_at TIMESTAMPTZ NULL, -- NULL = actif, sinon date de suppression
  metadata JSONB NULL -- pour stocker des infos supplémentaires si nécessaire
);

-- 2. CRÉER LES INDEX POUR LA PERFORMANCE
-- ============================================
-- Index principal: notifications actives (non dismissées) pour un utilisateur
CREATE INDEX idx_notifications_user_active 
  ON notifications(user_id, created_at DESC) 
  WHERE dismissed_at IS NULL;

-- Index par type
CREATE INDEX idx_notifications_type 
  ON notifications(type);

-- Index sur reference_id pour les jointures
CREATE INDEX idx_notifications_reference 
  ON notifications(reference_id);

-- Index composé pour les requêtes fréquentes
CREATE INDEX idx_notifications_user_type_active 
  ON notifications(user_id, type, created_at DESC) 
  WHERE dismissed_at IS NULL;

-- 3. CONFIGURER ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir leurs propres notifications
CREATE POLICY "Users can view their own notifications" 
  ON notifications 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent mettre à jour leurs propres notifications (read/dismiss)
CREATE POLICY "Users can update their own notifications" 
  ON notifications 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy: Le système peut créer des notifications
CREATE POLICY "System can insert notifications" 
  ON notifications 
  FOR INSERT 
  WITH CHECK (true);

-- 4. MIGRER LES DONNÉES EXISTANTES
-- ============================================

-- Migrer les notifications wishlist
INSERT INTO notifications (id, user_id, type, reference_id, created_at, read_at, dismissed_at)
SELECT 
  id,
  user_id,
  'wishlist' as type,
  user_game_id as reference_id,
  created_at,
  CASE WHEN is_validated THEN validated_at ELSE NULL END as read_at,
  NULL as dismissed_at -- Les anciennes notifications restent actives
FROM wishlist_notifications
WHERE is_validated = false -- Ne migrer que les notifications non validées
ON CONFLICT (id) DO NOTHING;

-- Migrer les notifications achievement
INSERT INTO notifications (id, user_id, type, reference_id, created_at, read_at, dismissed_at)
SELECT 
  id,
  user_id,
  'achievement' as type,
  user_achievement_id as reference_id,
  created_at,
  CASE WHEN is_viewed THEN created_at ELSE NULL END as read_at,
  NULL as dismissed_at
FROM achievement_notifications
WHERE is_viewed = false -- Ne migrer que les notifications non vues
ON CONFLICT (id) DO NOTHING;

-- 5. CRÉER LES FONCTIONS ET TRIGGERS
-- ============================================

-- Fonction: Créer automatiquement une notification wishlist quand buy = true
CREATE OR REPLACE FUNCTION auto_create_wishlist_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Si buy passe à true (de false ou null)
  IF NEW.buy = true AND (OLD.buy IS NULL OR OLD.buy = false) THEN
    -- Créer la notification
    INSERT INTO notifications (user_id, type, reference_id)
    VALUES (NEW.user_id, 'wishlist', NEW.id)
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
    UPDATE notifications 
    SET dismissed_at = NOW()
    WHERE reference_id = NEW.id 
      AND type = 'wishlist'
      AND dismissed_at IS NULL;
    
    RAISE NOTICE 'Notifications wishlist dismissed pour user_game_id: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Créer notification quand buy = true
DROP TRIGGER IF EXISTS trigger_create_wishlist_notification ON user_games;
CREATE TRIGGER trigger_create_wishlist_notification
  AFTER INSERT OR UPDATE OF buy ON user_games
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_wishlist_notification();

-- Trigger: Dismiss notification quand buy = false
DROP TRIGGER IF EXISTS trigger_dismiss_wishlist_notification ON user_games;
CREATE TRIGGER trigger_dismiss_wishlist_notification
  AFTER UPDATE OF buy ON user_games
  FOR EACH ROW
  EXECUTE FUNCTION auto_dismiss_wishlist_notification();

-- Fonction: Marquer une notification comme lue
CREATE OR REPLACE FUNCTION mark_notification_as_read(notification_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE notifications
  SET read_at = NOW()
  WHERE id = notification_id
    AND user_id = auth.uid()
    AND read_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction: Dismiss (supprimer) une notification
CREATE OR REPLACE FUNCTION dismiss_notification(notification_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE notifications
  SET dismissed_at = NOW()
  WHERE id = notification_id
    AND user_id = auth.uid()
    AND dismissed_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. NETTOYER LES ANCIENNES TABLES
-- ============================================
-- Note: On garde les anciennes tables pour l'instant pour rollback si besoin
-- Elles seront supprimées dans une migration ultérieure après validation

-- Désactiver les anciens triggers
DROP TRIGGER IF EXISTS create_wishlist_notification_trigger ON user_games;
DROP TRIGGER IF EXISTS update_wishlist_buy_status_trigger ON wishlist_notifications;

-- Désactiver les anciennes fonctions
DROP FUNCTION IF EXISTS create_wishlist_notifications() CASCADE;
DROP FUNCTION IF EXISTS validate_wishlist_notification(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_wishlist_buy_status() CASCADE;
DROP FUNCTION IF EXISTS cleanup_orphaned_wishlist_notifications() CASCADE;

-- 7. GRANTS POUR LES FONCTIONS
-- ============================================
GRANT EXECUTE ON FUNCTION auto_create_wishlist_notification() TO authenticated;
GRANT EXECUTE ON FUNCTION auto_dismiss_wishlist_notification() TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_as_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION dismiss_notification(UUID) TO authenticated;

-- 8. COMMENTAIRES POUR DOCUMENTATION
-- ============================================
COMMENT ON TABLE notifications IS 'Table unifiée pour toutes les notifications (wishlist, achievements, etc.)';
COMMENT ON COLUMN notifications.type IS 'Type de notification: wishlist, achievement, friend';
COMMENT ON COLUMN notifications.reference_id IS 'ID de référence: user_game_id pour wishlist, user_achievement_id pour achievement';
COMMENT ON COLUMN notifications.read_at IS 'Date de lecture. NULL = non lu';
COMMENT ON COLUMN notifications.dismissed_at IS 'Date de suppression. NULL = actif, sinon supprimé/archivé';
COMMENT ON COLUMN notifications.metadata IS 'Métadonnées additionnelles en JSON';

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================

