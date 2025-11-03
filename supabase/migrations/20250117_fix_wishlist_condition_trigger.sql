-- Trigger pour réinitialiser condition à NULL UNIQUEMENT quand le statut est WISHLIST
-- Cela évite les violations de contrainte car un jeu en wishlist n'a pas d'état physique
-- MAIS condition reste optionnel pour tous les autres statuts

CREATE OR REPLACE FUNCTION public.handle_wishlist_condition()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le statut est WISHLIST ou wishlist, réinitialiser condition à NULL
  -- Pour tous les autres statuts, on laisse condition tel quel (peut être NULL ou avoir une valeur)
  IF NEW.status = 'WISHLIST' OR NEW.status = 'wishlist' THEN
    NEW.condition := NULL;
  END IF;
  -- Si le statut n'est PAS wishlist, on ne touche pas à condition
  -- Il peut rester NULL ou garder sa valeur précédente
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS trigger_wishlist_condition ON public.user_games;

-- Créer le trigger
CREATE TRIGGER trigger_wishlist_condition
  BEFORE INSERT OR UPDATE ON public.user_games
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_wishlist_condition();

-- Nettoyer les données existantes : mettre condition à NULL pour tous les jeux en wishlist
UPDATE public.user_games
SET condition = NULL
WHERE (status = 'WISHLIST' OR status = 'wishlist')
  AND condition IS NOT NULL;

