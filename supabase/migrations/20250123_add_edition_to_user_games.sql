-- Ajouter un champ édition au lien utilisateur-jeu
-- Valeurs possibles: null (standard), ou une des éditions prédéfinies, ou "autres" avec un texte libre

DO $$
BEGIN
  -- Ajouter la colonne si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_games' AND column_name = 'edition'
  ) THEN
    ALTER TABLE public.user_games
      ADD COLUMN edition TEXT;
  END IF;

  -- Ajouter la colonne edition_other si elle n'existe pas (pour le texte libre quand "autres" est sélectionné)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_games' AND column_name = 'edition_other'
  ) THEN
    ALTER TABLE public.user_games
      ADD COLUMN edition_other TEXT;
  END IF;
END $$;

COMMENT ON COLUMN public.user_games.edition IS 'Édition du jeu (standard, collector, limitée, deluxe, ultimate, goty, day_one, prestige, steelbook, autres)';
COMMENT ON COLUMN public.user_games.edition_other IS 'Texte libre pour l''édition si "autres" est sélectionné';

