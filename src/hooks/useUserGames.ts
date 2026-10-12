import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { transformUserGameItemSync } from '@/lib/game-utils';
import { useAuth } from '@/context/auth-context';
import { handleSupabaseError } from '@/lib/error-handler';
import { queryKeys, collectionQueryOptions } from '@/lib/react-query-config';
import { useTranslations } from 'next-intl';


export type CollectionGame = {
  id: string;
  /** id de la ligne user_games (un jeu peut avoir plusieurs exemplaires/éditions) */
  user_game_id?: string;
  igdb_id: number;
  title: string;
  release_date: string | null;
  developer: string;
  publisher: string;
  description_en: string | null;
  description_fr: string | null;
  cover_url: string | null;
  console_id: string;
  console_name?: string;
  average_rating: number | null;
  genres: Array<{ id: string; name: string }>;
  status?: string;
  rating?: number | null;
  notes?: string;
  review?: string | null;
  created_at?: string;
  updated_at?: string;
  purchase_date?: string | null;
  play_time?: number | null;
  completion_percentage?: number | null;
  buy_price?: number | null;
  sell_price?: number | null;
  edition?: string | null;
  edition_other?: string | null;
};

// Types pour les paramètres de filtrage
export interface UserGamesFilters {
  status?: string;
  console_id?: string;
  genre_id?: string;
  search?: string;
  tab?: 'collection' | 'wishlist';
  sortOrder?: 'alphabetical' | 'date-desc' | 'rating-desc';
}

const USER_GAMES_PAGE_SIZE = 30;

/** IDs des exemplaires (user_games.id) marqués vendus (sell_price non null) — le RPC n’expose pas toujours sell_price. */
export async function fetchSoldGameIdsSet(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('user_games')
    .select('id')
    .eq('user_id', userId)
    .not('sell_price', 'is', null);

  if (error) {
    console.error('fetchSoldGameIdsSet:', error);
    throw new Error('Impossible de charger les jeux vendus');
  }

  return new Set((data ?? []).map((r: { id: string }) => String(r.id)));
}

const isSold = (soldSet: Set<string>, g: CollectionGame) =>
  soldSet.has(g.user_game_id ?? g.id);

type UserGamesRpcPage = { games: CollectionGame[]; rpcRowCount: number };

function buildUserGamesFilteredRpcParams(
  userId: string,
  filters: UserGamesFilters | undefined,
  offset: number,
  limit: number
) {
  return {
    p_user_id: userId,
    p_console_id: filters?.console_id && filters.console_id !== 'all' ? filters.console_id : null,
    p_genre_id: filters?.genre_id && filters.genre_id !== 'all' ? filters.genre_id : null,
    p_search_term: filters?.search?.trim() || null,
    p_status_filter: filters?.status || 'all',
    p_tab: filters?.tab || 'collection',
    p_sort_order:
      filters?.sortOrder === 'date-desc'
        ? 'date_desc'
        : filters?.sortOrder === 'alphabetical'
          ? 'alphabetical'
          : filters?.sortOrder === 'rating-desc'
            ? 'rating_desc'
            : 'date_desc',
    p_offset: offset,
    p_limit: limit,
  };
}

/** Toutes les pages correspondant aux filtres (export, etc.) */
export async function fetchAllUserGamesFiltered(
  userId: string,
  filters?: UserGamesFilters
): Promise<CollectionGame[]> {
  const soldSet = await fetchSoldGameIdsSet(userId);
  const all: CollectionGame[] = [];
  let pageIndex = 0;

  while (true) {
    const offset = pageIndex * USER_GAMES_PAGE_SIZE;
    const result = await supabase.rpc(
      'get_user_games_filtered_paginated',
      buildUserGamesFilteredRpcParams(userId, filters, offset, USER_GAMES_PAGE_SIZE)
    );

    if (result.error) {
      console.error('RPC error:', result.error);
      throw new Error('Service de filtrage non disponible');
    }

    const rawRows = result.data ?? [];
    const batch = (rawRows
      .map(transformUserGameItemSync)
      .filter(Boolean) as CollectionGame[])
      .filter((g) => !isSold(soldSet, g));

    all.push(...batch);
    if (rawRows.length < USER_GAMES_PAGE_SIZE) break;
    pageIndex++;
  }

  return all;
}

// Hook séparé pour récupérer les stats complètes (tous les jeux pour les compteurs)
export function useUserGamesStats(tab: 'collection' | 'wishlist' = 'collection') {
  const { user, isLoading: authLoading } = useAuth();
  const t = useTranslations('collection');

  const query = useQuery<{ consoles: Array<{ id: string; name: string; count: number }>; genres: Array<{ id: string; name: string; count: number }> }, Error>({
    queryKey: ['userGamesStats', user?.id, tab],
    queryFn: async () => {
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      // Récupérer tous les jeux avec leurs relations pour calculer les stats complètes
      const { data, error } = await supabase
        .from('user_games')
        .select(`
          status,
          sell_price,
          games:game_id(
            console_id,
            consoles:console_id(id, name),
            game_genres(genre_id, genres(id, name))
          )
        `)
        .eq('user_id', user.id)
        .is('sell_price', null);

      if (error) {
        handleSupabaseError(error, 'useUserGamesStats', 'Erreur lors de la récupération des stats');
        return { consoles: [], genres: [] };
      }

      if (!data || data.length === 0) {
        return { consoles: [], genres: [] };
      }

      // Filtrer les données selon l'onglet actif
      const filteredData = data.filter((userGame: any) => {
        const status = userGame.status || '';
        if (tab === 'collection') {
          return !['wishlist', 'WISHLIST'].includes(status);
        } else {
          return ['wishlist', 'WISHLIST'].includes(status);
        }
      });


      // Calculer les stats des consoles
      const consoleMap = new Map<string, { id: string; name: string; count: number }>();
      consoleMap.set('all', { id: 'all', name: t('allConsoles'), count: filteredData.length });

      filteredData.forEach((userGame: any) => {
        const game = userGame.games;
        if (game?.consoles?.id && game?.consoles?.name) {
          const key = game.consoles.id;
          if (consoleMap.has(key)) {
            consoleMap.get(key)!.count++;
          } else {
            consoleMap.set(key, { id: game.consoles.id, name: game.consoles.name, count: 1 });
          }
        }
      });

      // Calculer les stats des genres
      const genreMap = new Map<string, { id: string; name: string; count: number }>();
      genreMap.set('all', { id: 'all', name: t('allGenres'), count: filteredData.length });

      filteredData.forEach((userGame: any) => {
        const game = userGame.games;
        if (game?.game_genres && Array.isArray(game.game_genres)) {
          game.game_genres.forEach((gameGenre: any) => {
            if (gameGenre.genres?.id && gameGenre.genres?.name) {
              const key = gameGenre.genres.id;
              if (genreMap.has(key)) {
                genreMap.get(key)!.count++;
              } else {
                genreMap.set(key, { id: gameGenre.genres.id, name: gameGenre.genres.name, count: 1 });
              }
            }
          });
        }
      });

      // Convertir Map en tableau et trier
      const consoles = Array.from(consoleMap.values()).sort((a, b) => {
        if (a.id === 'all') return -1;
        if (b.id === 'all') return 1;
        return b.count - a.count;
      });

      const genres = Array.from(genreMap.values()).sort((a, b) => {
        if (a.id === 'all') return -1;
        if (b.id === 'all') return 1;
        return b.count - a.count;
      });

      return { consoles, genres };
    },
    enabled: !!user && !authLoading,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  return query;
}

export function useUserGames(filters?: UserGamesFilters) {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const query = useInfiniteQuery<UserGamesRpcPage, Error>({
    queryKey: queryKeys.userGames(user?.id, filters),
    queryFn: async ({ pageParam }) => {
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      const offset = (pageParam as number) * USER_GAMES_PAGE_SIZE;

      // staleTime 0 : toujours à jour après une vente (ensureQueryData renverrait le cache invalidé)
      const soldIds = await queryClient.fetchQuery({
        queryKey: queryKeys.soldGameIds(user.id),
        queryFn: () => fetchSoldGameIdsSet(user.id),
        staleTime: 0,
      });

      const result = await supabase.rpc(
        'get_user_games_filtered_paginated',
        buildUserGamesFilteredRpcParams(user.id, filters, offset, USER_GAMES_PAGE_SIZE)
      );

      if (result.error) {
        console.error('RPC error:', result.error);
        throw new Error('Service de filtrage non disponible');
      }

      const rawRows = result.data ?? [];
      const formattedGames = rawRows
        .map(transformUserGameItemSync)
        .filter(Boolean) as CollectionGame[];

      const games = formattedGames.filter((g) => !isSold(soldIds, g));

      return { games, rpcRowCount: rawRows.length };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const rowCount = Array.isArray(lastPage)
        ? lastPage.length
        : lastPage.rpcRowCount;
      return rowCount === USER_GAMES_PAGE_SIZE ? allPages.length : undefined;
    },
    enabled: !!user && !authLoading,
    ...collectionQueryOptions,
  });

  // Écouter les changements en temps réel pour invalider le cache
  useEffect(() => {
    if (!user) return;

    // S'abonner aux changements sur user_games pour cet utilisateur
    const channel = supabase
      .channel(`user_games_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'user_games',
          filter: `user_id=eq.${user.id}`,
        },
        async (_payload: any) => {
          await queryClient.invalidateQueries({ queryKey: queryKeys.soldGameIds(user.id) });
          await queryClient.invalidateQueries({ queryKey: queryKeys.userGames(user.id) });

          await new Promise(resolve => setTimeout(resolve, 100));

          await queryClient.refetchQueries({
            queryKey: queryKeys.userGames(user.id),
            type: 'all'
          });
        }
      )
      .subscribe((status: string) => {
        if (status === 'CHANNEL_ERROR') {
          console.error(`Erreur d'abonnement Realtime pour user_games de l'utilisateur ${user.id}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return {
    ...query,
    games:
      query.data?.pages.flatMap((p: UserGamesRpcPage | CollectionGame[]) => {
        if (p && typeof p === 'object' && 'games' in p && Array.isArray((p as UserGamesRpcPage).games)) {
          return (p as UserGamesRpcPage).games;
        }
        if (Array.isArray(p)) {
          return p as CollectionGame[];
        }
        return [];
      }) ?? [],
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}

