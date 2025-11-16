-- ============================================
-- MIGRATION: Créer automatiquement les notifications achievement
-- ============================================
-- Créer un trigger qui crée automatiquement une notification
-- quand un achievement est débloqué (INSERT dans user_achievements)

-- Fonction: Créer automatiquement une notification achievement
CREATE OR REPLACE FUNCTION auto_create_achievement_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Créer une notification pour le nouvel achievement débloqué
  INSERT INTO notifications (
    user_id,
    type,
    user_achievement_id,
    is_read,
    is_dismissed,
    created_at
  )
  VALUES (
    NEW.user_id,
    'achievement',
    NEW.id,
    FALSE,
    FALSE,
    NOW()
  )
  ON CONFLICT DO NOTHING; -- Éviter les doublons si la notification existe déjà
  
  RAISE NOTICE 'Notification achievement créée pour user_achievement_id: %', NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger sur user_achievements
DROP TRIGGER IF EXISTS trigger_create_achievement_notification ON user_achievements;

CREATE TRIGGER trigger_create_achievement_notification
  AFTER INSERT ON user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_achievement_notification();

-- Grants
GRANT EXECUTE ON FUNCTION auto_create_achievement_notification() TO authenticated;

-- Commentaire
COMMENT ON FUNCTION auto_create_achievement_notification() IS 'Crée automatiquement une notification quand un achievement est débloqué';

