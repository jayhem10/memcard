-- Ajoute une contrainte d'unicité pour empêcher les doublons de jeux par (igdb_id, console_id)
-- Stratégie:
-- 1) Créer un index unique si absent
-- 2) Attacher cet index comme contrainte UNIQUE (idempotent)

-- Créer l'index unique s'il n'existe pas
CREATE UNIQUE INDEX IF NOT EXISTS idx_games_igdb_console
ON public.games (igdb_id, console_id);

-- Ajouter la contrainte UNIQUE en réutilisant l'index, si elle n'existe pas encore
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE c.conname = 'games_igdb_console_unique'
      AND t.relname = 'games'
  ) THEN
    ALTER TABLE public.games
      ADD CONSTRAINT games_igdb_console_unique
      UNIQUE USING INDEX idx_games_igdb_console;
  END IF;
END$$;


