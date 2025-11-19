-- Correction des fonctions RPC pour les collectionneurs
-- À exécuter dans Supabase SQL Editor

-- 1. Supprimer les anciennes fonctions si elles existent
DROP FUNCTION IF EXISTS get_user_games_filtered_paginated(UUID, UUID, UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_other_user_games_stats(UUID, TEXT);

-- 2. Créer la fonction de filtrage simplifiée et robuste
CREATE OR REPLACE FUNCTION get_user_games_filtered_paginated(
  p_user_id UUID,
  p_console_id UUID DEFAULT NULL,
  p_genre_id UUID DEFAULT NULL,
  p_search_term TEXT DEFAULT NULL,
  p_status_filter TEXT DEFAULT 'all',
  p_tab TEXT DEFAULT 'collection',
  p_sort_order TEXT DEFAULT 'date_desc',
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
LANGUAGE sql
STABLE
AS $$
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
      'game_genres', COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'genre_id', gg.genre_id,
              'genres', jsonb_build_object('id', gen.id, 'name', gen.name)
            )
          )
          FROM game_genres gg
          LEFT JOIN genres gen ON gen.id = gg.genre_id
          WHERE gg.game_id = g.id
        ),
        '[]'::jsonb
      )
    ) as games
  FROM user_games ug
  INNER JOIN games g ON g.id = ug.game_id
  LEFT JOIN consoles c ON c.id = g.console_id
  WHERE ug.user_id = p_user_id
    -- Filtre par onglet
    AND CASE
      WHEN p_tab = 'wishlist' THEN ug.status IN ('wishlist', 'WISHLIST')
      ELSE ug.status NOT IN ('wishlist', 'WISHLIST')
    END
    -- Filtre par statut (collection uniquement)
    AND CASE
      WHEN p_tab = 'collection' AND p_status_filter != 'all' THEN
        CASE p_status_filter
          WHEN 'playing' THEN ug.status IN ('in_progress', 'IN_PROGRESS')
          WHEN 'completed' THEN ug.status IN ('completed', 'COMPLETED')
          WHEN 'backlog' THEN ug.status IN ('not_started', 'NOT_STARTED')
          ELSE true
        END
      ELSE true
    END
    -- Filtre par console
    AND CASE WHEN p_console_id IS NOT NULL THEN g.console_id = p_console_id ELSE true END
    -- Filtre par genre
    AND CASE WHEN p_genre_id IS NOT NULL THEN
      EXISTS (SELECT 1 FROM game_genres gg WHERE gg.game_id = ug.game_id AND gg.genre_id = p_genre_id)
    ELSE true END
    -- Filtre par recherche
    AND CASE WHEN p_search_term IS NOT NULL AND trim(p_search_term) != '' THEN
      (g.title ILIKE '%' || trim(p_search_term) || '%' OR
       g.publisher ILIKE '%' || trim(p_search_term) || '%' OR
       g.developer ILIKE '%' || trim(p_search_term) || '%')
    ELSE true END
  ORDER BY
    CASE p_sort_order
      WHEN 'date_desc' THEN ug.created_at END DESC,
    CASE p_sort_order
      WHEN 'date_asc' THEN ug.created_at END ASC,
    CASE p_sort_order
      WHEN 'alphabetical' THEN g.title END ASC,
    ug.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- 3. Créer la fonction de statistiques simplifiée
CREATE OR REPLACE FUNCTION get_other_user_games_stats(
  p_user_id UUID,
  p_tab TEXT DEFAULT 'collection'
)
RETURNS TABLE (
  total_games BIGINT,
  consoles JSONB,
  genres JSONB
)
LANGUAGE sql
STABLE
AS $$
  WITH filtered_games AS (
    SELECT ug.id, g.console_id, g.id as game_id
    FROM user_games ug
    INNER JOIN games g ON g.id = ug.game_id
    WHERE ug.user_id = p_user_id
      AND CASE
        WHEN p_tab = 'wishlist' THEN ug.status IN ('wishlist', 'WISHLIST')
        ELSE ug.status NOT IN ('wishlist', 'WISHLIST')
      END
  )
  SELECT
    (SELECT COUNT(*) FROM filtered_games) as total_games,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', c.id,
            'name', c.name,
            'count', stats.game_count
          )
        )
        FROM (
          SELECT fg.console_id, COUNT(*) as game_count
          FROM filtered_games fg
          GROUP BY fg.console_id
          ORDER BY game_count DESC
        ) stats
        LEFT JOIN consoles c ON c.id = stats.console_id
        WHERE c.id IS NOT NULL
      ),
      '[]'::jsonb
    ) as consoles,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', gen.id,
            'name', gen.name,
            'count', stats.game_count
          )
        )
        FROM (
          SELECT gg.genre_id, COUNT(DISTINCT fg.id) as game_count
          FROM filtered_games fg
          INNER JOIN game_genres gg ON gg.game_id = fg.game_id
          GROUP BY gg.genre_id
          ORDER BY game_count DESC
        ) stats
        LEFT JOIN genres gen ON gen.id = stats.genre_id
        WHERE gen.id IS NOT NULL
      ),
      '[]'::jsonb
    ) as genres;
$$;

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION get_user_games_filtered_paginated TO authenticated;
GRANT EXECUTE ON FUNCTION get_other_user_games_stats TO authenticated;
