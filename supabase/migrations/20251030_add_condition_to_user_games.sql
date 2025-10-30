-- Ajouter un champ d'état (condition) au lien utilisateur-jeu
-- Valeurs autorisées: neuf, comme neuf, très bon état, bon état, état moyen, mauvais état

DO $$
BEGIN
  -- Ajouter la colonne si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_games' AND column_name = 'condition'
  ) THEN
    ALTER TABLE public.user_games
      ADD COLUMN condition TEXT;
  END IF;

  -- Ajouter une contrainte de validation si elle n'existe pas déjà
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_games_condition_check'
  ) THEN
    ALTER TABLE public.user_games
      ADD CONSTRAINT user_games_condition_check
      CHECK (
        condition IS NULL OR condition IN (
          'neuf',
          'comme neuf',
          'très bon état',
          'bon état',
          'état moyen',
          'mauvais état'
        )
      );
  END IF;
END $$;

COMMENT ON COLUMN public.user_games.condition IS 'État du jeu pour cette copie utilisateur (neuf, très bon état, etc.)';

