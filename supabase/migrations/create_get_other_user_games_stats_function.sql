-- Créer une fonction RPC pour récupérer les statistiques des jeux d'un autre utilisateur
-- À exécuter dans l'éditeur SQL de Supabase

CREATE OR REPLACE FUNCTION get_other_user_games_stats(
  p_user_id UUID,
  p_tab TEXT DEFAULT 'collection'
)
RETURNS TABLE (
  total_games BIGINT,
  consoles JSONB,
  genres JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_query TEXT;
  total_count BIGINT := 0;
BEGIN
  -- Construire la requête de base selon l'onglet
  IF p_tab = 'wishlist' THEN
    base_query := 'FROM user_games ug WHERE ug.user_id = ' || quote_literal(p_user_id) || ' AND ug.status IN (''wishlist'', ''WISHLIST'')';
  ELSE
    base_query := 'FROM user_games ug WHERE ug.user_id = ' || quote_literal(p_user_id) || ' AND ug.status NOT IN (''wishlist'', ''WISHLIST'')';
  END IF;

  -- Calculer le nombre total de jeux
  EXECUTE 'SELECT COUNT(*) ' || base_query INTO total_count;

  -- Retourner les statistiques
  RETURN QUERY
  SELECT
    total_count,
    -- Statistiques des consoles
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'count', console_stats.game_count
        )
      ) FILTER (WHERE c.id IS NOT NULL),
      '[]'::jsonb
    ) as consoles,
    -- Statistiques des genres
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', gen.id,
          'name', gen.name,
          'count', genre_stats.game_count
        )
      ) FILTER (WHERE gen.id IS NOT NULL),
      '[]'::jsonb
    ) as genres
  FROM (
    -- Placeholder pour permettre la jointure
    SELECT 1 as dummy
  ) as dummy_table
  LEFT JOIN (
    -- Statistiques des consoles
    SELECT
      g.console_id,
      COUNT(*) as game_count
    FROM user_games ug
    INNER JOIN games g ON g.id = ug.game_id
    WHERE ug.user_id = p_user_id
      AND (
        (p_tab = 'wishlist' AND ug.status IN ('wishlist', 'WISHLIST'))
        OR
        (p_tab != 'wishlist' AND ug.status NOT IN ('wishlist', 'WISHLIST'))
      )
    GROUP BY g.console_id
    ORDER BY game_count DESC
  ) as console_stats ON true
  LEFT JOIN consoles c ON c.id = console_stats.console_id

  LEFT JOIN (
    -- Statistiques des genres
    SELECT
      gg.genre_id,
      COUNT(DISTINCT ug.id) as game_count
    FROM user_games ug
    INNER JOIN games g ON g.id = ug.game_id
    INNER JOIN game_genres gg ON gg.game_id = g.id
    WHERE ug.user_id = p_user_id
      AND (
        (p_tab = 'wishlist' AND ug.status IN ('wishlist', 'WISHLIST'))
        OR
        (p_tab != 'wishlist' AND ug.status NOT IN ('wishlist', 'WISHLIST'))
      )
    GROUP BY gg.genre_id
    ORDER BY game_count DESC
  ) as genre_stats ON true
  LEFT JOIN genres gen ON gen.id = genre_stats.genre_id;

END;
$$;

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION get_other_user_games_stats TO authenticated;
