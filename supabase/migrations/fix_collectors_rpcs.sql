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
      'average_rating', g.average_rating,
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
    CASE WHEN p_sort_order = 'rating_desc' THEN g.average_rating END DESC NULLS LAST,
    CASE WHEN p_sort_order = 'date_desc' THEN ug.created_at END DESC,
    CASE WHEN p_sort_order = 'date_asc' THEN ug.created_at END ASC,
    CASE WHEN p_sort_order = 'alphabetical' THEN g.title END ASC
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

-- =================================================================================
-- PARTIE 2: SYSTÈME D'AMIS
-- =================================================================================

-- 1. Créer la table user_friends si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.user_friends (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Contrainte pour éviter les auto-amis
    CONSTRAINT no_self_friend CHECK (user_id != friend_id),

    -- Contrainte unique pour éviter les doublons (unidirectionnel)
    CONSTRAINT unique_user_friend UNIQUE (user_id, friend_id)
);

-- Activer RLS sur la table user_friends si ce n'est pas déjà fait
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'user_friends'
        AND n.nspname = 'public'
        AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.user_friends ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS activé pour user_friends';
    ELSE
        RAISE NOTICE 'RLS déjà activé pour user_friends';
    END IF;
END $$;


-- 3. Politiques RLS pour user_friends
DO $$
BEGIN
    -- Politique SELECT (si elle n'existe pas)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'user_friends'
        AND schemaname = 'public'
        AND policyname = 'Users can view their own friendships'
    ) THEN
        CREATE POLICY "Users can view their own friendships"
        ON public.user_friends FOR SELECT
        TO authenticated
        USING (auth.uid() = user_id OR auth.uid() = friend_id);
        RAISE NOTICE 'Politique SELECT créée pour user_friends';
    ELSE
        RAISE NOTICE 'Politique SELECT déjà existante pour user_friends';
    END IF;

    -- Politique INSERT (si elle n'existe pas)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'user_friends'
        AND schemaname = 'public'
        AND policyname = 'Users can create their own friendships'
    ) THEN
        CREATE POLICY "Users can create their own friendships"
        ON public.user_friends FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = user_id);
        RAISE NOTICE 'Politique INSERT créée pour user_friends';
    ELSE
        RAISE NOTICE 'Politique INSERT déjà existante pour user_friends';
    END IF;

    -- Politique DELETE (si elle n'existe pas)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'user_friends'
        AND schemaname = 'public'
        AND policyname = 'Users can delete their own friendships'
    ) THEN
        CREATE POLICY "Users can delete their own friendships"
        ON public.user_friends FOR DELETE
        TO authenticated
        USING (auth.uid() = user_id);
        RAISE NOTICE 'Politique DELETE créée pour user_friends';
    ELSE
        RAISE NOTICE 'Politique DELETE déjà existante pour user_friends';
    END IF;
END $$;

-- 4. Créer la fonction RPC are_users_friends
CREATE OR REPLACE FUNCTION public.are_users_friends(
    p_user_id UUID,
    p_friend_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_friends
        WHERE (user_id = p_user_id AND friend_id = p_friend_id)
           OR (user_id = p_friend_id AND friend_id = p_user_id)
    );
$$;

-- 5. Créer des index pour optimiser les performances (si ils n'existent pas)
CREATE INDEX IF NOT EXISTS idx_user_friends_user_id ON public.user_friends(user_id);
CREATE INDEX IF NOT EXISTS idx_user_friends_friend_id ON public.user_friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_user_friends_created_at ON public.user_friends(created_at);

-- 6. Activer Realtime pour user_friends (si pas déjà fait)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND tablename = 'user_friends'
        AND schemaname = 'public'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.user_friends;
        RAISE NOTICE 'Table user_friends ajoutée à la publication Realtime';
    ELSE
        RAISE NOTICE 'Table user_friends déjà dans la publication Realtime';
    END IF;
END $$;

-- 7. Ajouter la politique RLS pour que les amis puissent voir les collections
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'user_games'
        AND schemaname = 'public'
        AND policyname = 'Friends can view user games'
    ) THEN
        CREATE POLICY "Friends can view user games"
        ON public.user_games FOR SELECT
        TO authenticated
        USING (
            -- L'utilisateur peut voir ses propres jeux
            auth.uid() = user_id
            -- Ou les jeux des utilisateurs dont il est ami
            OR EXISTS (
                SELECT 1 FROM user_friends
                WHERE (user_id = auth.uid() AND friend_id = user_games.user_id)
                   OR (user_id = user_games.user_id AND friend_id = auth.uid())
            )
            -- Ou les jeux des profils publics
            OR is_profile_public(user_id)
        );
        RAISE NOTICE 'Politique RLS ajoutée pour les amis sur user_games';
    ELSE
        RAISE NOTICE 'Politique RLS pour les amis existe déjà sur user_games';
    END IF;
END $$;

-- 8. Donner les permissions pour la fonction are_users_friends
GRANT EXECUTE ON FUNCTION are_users_friends TO authenticated;
