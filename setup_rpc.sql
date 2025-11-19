-- Script SQL pour créer la fonction RPC de filtrage optimisé
-- À exécuter dans Supabase SQL Editor

-- Créer une fonction RPC générique pour récupérer les jeux filtrés avec pagination
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
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  query_text TEXT;
  where_conditions TEXT := '';
  order_clause TEXT := '';
BEGIN
  -- Construire les conditions WHERE
  where_conditions := 'ug.user_id = ' || quote_literal(p_user_id);

  -- Filtre par onglet (collection/wishlist)
  IF p_tab = 'wishlist' THEN
    where_conditions := where_conditions || ' AND ug.status IN (''wishlist'', ''WISHLIST'')';
  ELSIF p_tab = 'collection' THEN
    where_conditions := where_conditions || ' AND ug.status NOT IN (''wishlist'', ''WISHLIST'')';
  END IF;

  -- Filtre par statut (pour collection uniquement)
  IF p_tab = 'collection' AND p_status_filter != 'all' THEN
    CASE p_status_filter
      WHEN 'playing' THEN
        where_conditions := where_conditions || ' AND ug.status IN (''in_progress'', ''IN_PROGRESS'')';
      WHEN 'completed' THEN
        where_conditions := where_conditions || ' AND ug.status IN (''completed'', ''COMPLETED'')';
      WHEN 'backlog' THEN
        where_conditions := where_conditions || ' AND ug.status IN (''not_started'', ''NOT_STARTED'')';
    END CASE;
  END IF;

  -- Filtre par console
  IF p_console_id IS NOT NULL THEN
    where_conditions := where_conditions || ' AND g.console_id = ' || quote_literal(p_console_id);
  END IF;

  -- Filtre par genre
  IF p_genre_id IS NOT NULL THEN
    where_conditions := where_conditions || ' AND EXISTS (SELECT 1 FROM game_genres gg WHERE gg.game_id = g.id AND gg.genre_id = ' || quote_literal(p_genre_id) || ')';
  END IF;

  -- Filtre par recherche
  IF p_search_term IS NOT NULL AND trim(p_search_term) != '' THEN
    where_conditions := where_conditions || ' AND (g.title ILIKE ' || quote_literal('%' || trim(p_search_term) || '%') ||
                      ' OR g.publisher ILIKE ' || quote_literal('%' || trim(p_search_term) || '%') ||
                      ' OR g.developer ILIKE ' || quote_literal('%' || trim(p_search_term) || '%') || ')';
  END IF;

  -- Clause ORDER BY
  CASE p_sort_order
    WHEN 'date_desc' THEN
      order_clause := 'ug.created_at DESC';
    WHEN 'date_asc' THEN
      order_clause := 'ug.created_at ASC';
    WHEN 'alphabetical' THEN
      order_clause := 'g.title ASC';
    ELSE
      order_clause := 'ug.created_at DESC';
  END CASE;

  -- Construire la requête complète
  query_text := format('
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
        ''id'', g.id,
        ''igdb_id'', g.igdb_id,
        ''title'', g.title,
        ''release_date'', g.release_date,
        ''developer'', g.developer,
        ''publisher'', g.publisher,
        ''description_en'', g.description_en,
        ''description_fr'', g.description_fr,
        ''cover_url'', g.cover_url,
        ''console_id'', g.console_id,
        ''consoles'', jsonb_build_object(''id'', c.id, ''name'', c.name),
        ''game_genres'', (
          SELECT jsonb_agg(
            jsonb_build_object(
              ''genre_id'', gg.genre_id,
              ''genres'', jsonb_build_object(''id'', gen.id, ''name'', gen.name)
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
    WHERE %s
    ORDER BY %s
    LIMIT %s
    OFFSET %s',
    where_conditions,
    order_clause,
    p_limit,
    p_offset
  );

  -- Exécuter la requête dynamique
  RETURN QUERY EXECUTE query_text;
END;
$$;

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION get_user_games_filtered_paginated TO authenticated;
