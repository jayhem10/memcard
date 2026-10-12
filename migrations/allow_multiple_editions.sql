-- Plusieurs exemplaires (éditions) d'un même jeu par utilisateur.

-- 1) Supprimer l'unicité (user_id, game_id). Selon sa création, c'est une
--    contrainte (ALTER TABLE ... UNIQUE) ou un simple index : les deux
--    instructions sont idempotentes, celle qui ne s'applique pas est un no-op.
ALTER TABLE public.user_games DROP CONSTRAINT IF EXISTS unique_user_game;
DROP INDEX IF EXISTS public.unique_user_game;

-- 2) L'édition est toujours renseignée : 'standard' par défaut (les NULL existants sont migrés).
UPDATE public.user_games SET edition = 'standard' WHERE edition IS NULL OR edition = '';
ALTER TABLE public.user_games ALTER COLUMN edition SET DEFAULT 'standard';
ALTER TABLE public.user_games ALTER COLUMN edition SET NOT NULL;

-- 3) Empêcher uniquement les doublons de la MÊME édition parmi les exemplaires
--    réellement possédés (hors wishlist et hors exemplaires vendus : on peut racheter).
DROP INDEX IF EXISTS public.user_games_unique_edition_idx;
CREATE UNIQUE INDEX user_games_unique_edition_idx
  ON public.user_games (
    user_id,
    game_id,
    edition,
    COALESCE(lower(trim(edition_other)), '')
  )
  WHERE status NOT IN ('WISHLIST', 'wishlist') AND sell_price IS NULL;
