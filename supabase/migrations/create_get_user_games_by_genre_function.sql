-- Créer une fonction RPC Postgres pour récupérer les jeux d'un utilisateur filtrés par genre avec pagination
-- À exécuter dans l'éditeur SQL de Supabase (Dashboard > SQL Editor)
CREATE OR REPLACE FUNCTION get_user_games_by_genre_paginated(
  p_user_id UUID,
  p_genre_id UUID,
  p_tab TEXT DEFAULT 'collection',
  p_offset INTEGER DEFAULT 0,
  p_limit INTEGER DEFAULT 30
)
RETURNS TABLE (
  id UUID,
  game_id UUID,
  status TEXT,
  rating NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  purchase_date DATE,
  play_time INTEGER,
  completion_percentage NUMERIC,
  buy_price NUMERIC,
  buy TEXT,
  edition TEXT,
  edition_other TEXT,
  games JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ug.id,
    ug.game_id,
    ug.status,
    ug.rating,
    ug.notes,
    ug.created_at,
    ug.updated_at,
    ug.purchase_date,
    ug.play_time,
    ug.completion_percentage,
    ug.buy_price,
    ug.buy,
    ug.edition,
    ug.edition_other,
    jsonb_build_object(
      'id', g.id,
      'igdb_id', g.igdb_id,
      'title', g.title,
      'release_date', g.release_date,
      'developer', g.developer,
      'publisher', g.publisher,
      'description_en', g.description_en,
      'description_fr', g.description_fr,
      'cover_url', g.cover_url,
      'console_id', g.console_id,
      'consoles', jsonb_build_object('id', c.id, 'name', c.name),
      'game_genres', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'genre_id', gg.genre_id,
            'genres', jsonb_build_object('id', gen.id, 'name', gen.name)
          )
        )
        FROM game_genres gg
        LEFT JOIN genres gen ON gen.id = gg.genre_id
        WHERE gg.game_id = g.id
      )
    ) as games
  FROM user_games ug
  INNER JOIN games g ON g.id = ug.game_id
  LEFT JOIN consoles c ON c.id = g.console_id
  INNER JOIN game_genres gg ON gg.game_id = g.id AND gg.genre_id = p_genre_id
  WHERE ug.user_id = p_user_id
    AND (
      (p_tab = 'collection' AND ug.status NOT IN ('wishlist', 'WISHLIST'))
      OR
      (p_tab = 'wishlist' AND ug.status IN ('wishlist', 'WISHLIST'))
    )
  ORDER BY ug.created_at ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
