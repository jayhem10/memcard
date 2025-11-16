-- ============================================
-- MIGRATION: Fonction pour relancer la vérification de tous les achievements
-- ============================================
-- Cette fonction permet de relancer la vérification de tous les achievements
-- pour un utilisateur ou tous les utilisateurs

-- Fonction: Relancer la vérification de tous les achievements pour un utilisateur
CREATE OR REPLACE FUNCTION recheck_all_achievements(p_user_id UUID DEFAULT NULL)
RETURNS TABLE(
  user_id UUID,
  achievements_unlocked INTEGER,
  notifications_created INTEGER
) AS $$
DECLARE
  v_user_id UUID;
  v_achievements_count INTEGER := 0;
  v_notifications_count INTEGER := 0;
BEGIN
  -- Si p_user_id est NULL, vérifier pour tous les utilisateurs
  IF p_user_id IS NULL THEN
    FOR v_user_id IN SELECT DISTINCT id FROM auth.users LOOP
      -- Vérifier les achievements pour cet utilisateur
      PERFORM check_achievements(v_user_id);
      
      -- Compter les achievements débloqués
      SELECT COUNT(*) INTO v_achievements_count
      FROM user_achievements
      WHERE user_id = v_user_id;
      
      -- Compter les notifications créées (via le trigger)
      SELECT COUNT(*) INTO v_notifications_count
      FROM notifications
      WHERE user_id = v_user_id
        AND type = 'achievement'
        AND is_dismissed = FALSE;
      
      RETURN QUERY SELECT v_user_id, v_achievements_count, v_notifications_count;
    END LOOP;
  ELSE
    -- Vérifier les achievements pour l'utilisateur spécifié
    PERFORM check_achievements(p_user_id);
    
    -- Compter les achievements débloqués
    SELECT COUNT(*) INTO v_achievements_count
    FROM user_achievements
    WHERE user_id = p_user_id;
    
    -- Compter les notifications créées (via le trigger)
    SELECT COUNT(*) INTO v_notifications_count
    FROM notifications
    WHERE user_id = p_user_id
      AND type = 'achievement'
      AND is_dismissed = FALSE;
    
    RETURN QUERY SELECT p_user_id, v_achievements_count, v_notifications_count;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction simplifiée: Relancer pour un utilisateur spécifique
CREATE OR REPLACE FUNCTION recheck_user_achievements(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Vérifier et débloquer les achievements
  PERFORM check_achievements(p_user_id);
  
  -- Compter les achievements débloqués
  SELECT COUNT(*) INTO v_count
  FROM user_achievements
  WHERE user_id = p_user_id;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grants
GRANT EXECUTE ON FUNCTION recheck_all_achievements(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION recheck_user_achievements(UUID) TO authenticated;

-- Commentaires
COMMENT ON FUNCTION recheck_all_achievements(UUID) IS 'Relance la vérification de tous les achievements pour un utilisateur ou tous les utilisateurs';
COMMENT ON FUNCTION recheck_user_achievements(UUID) IS 'Relance la vérification des achievements pour un utilisateur spécifique';

