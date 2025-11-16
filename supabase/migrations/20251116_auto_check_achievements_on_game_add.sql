-- ============================================
-- MIGRATION: Vérifier automatiquement les achievements après ajout de jeu
-- ============================================
-- Créer un trigger qui vérifie automatiquement les achievements
-- quand un jeu est ajouté à la collection (INSERT dans user_games)

-- Fonction: Vérifier automatiquement les achievements après ajout de jeu
CREATE OR REPLACE FUNCTION auto_check_achievements_on_game_add()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier les achievements uniquement si le jeu est ajouté à la collection (pas wishlist)
  -- Les achievements sont basés sur le nombre de jeux dans la collection
  IF NEW.status != 'WISHLIST' AND NEW.status != 'wishlist' THEN
    -- Appeler la fonction check_achievements pour vérifier et débloquer les achievements
    -- Le trigger sur user_achievements créera automatiquement les notifications
    PERFORM check_achievements(NEW.user_id);
    
    RAISE NOTICE 'Achievements vérifiés pour user_id: % après ajout de jeu', NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger sur user_games (INSERT et UPDATE)
DROP TRIGGER IF EXISTS trigger_check_achievements_on_game_add ON user_games;
DROP TRIGGER IF EXISTS trigger_check_achievements_on_game_update ON user_games;

CREATE TRIGGER trigger_check_achievements_on_game_add
  AFTER INSERT ON user_games
  FOR EACH ROW
  EXECUTE FUNCTION auto_check_achievements_on_game_add();

-- Trigger aussi sur UPDATE pour gérer les changements de status (wishlist -> collection)
CREATE TRIGGER trigger_check_achievements_on_game_update
  AFTER UPDATE OF status ON user_games
  FOR EACH ROW
  WHEN (OLD.status = 'WISHLIST' OR OLD.status = 'wishlist')
  EXECUTE FUNCTION auto_check_achievements_on_game_add();

-- Grants
GRANT EXECUTE ON FUNCTION auto_check_achievements_on_game_add() TO authenticated;

-- Commentaire
COMMENT ON FUNCTION auto_check_achievements_on_game_add() IS 'Vérifie automatiquement les achievements après ajout d''un jeu à la collection';

