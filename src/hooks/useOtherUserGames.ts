import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { transformUserGameItemSync } from '@/lib/game-utils';
import { CollectionGame } from './useUserGames';
import { supabase } from '@/lib/supabase';
import { queryKeys, collectionQueryOptions } from '@/lib/react-query-config';

export interface OtherUserGamesFilters {
  search?: string;
  console_id?: string;
  genre_id?: string;
  status?: string;
}

export function useOtherUserGames(userId: string | undefined, filters?: OtherUserGamesFilters) {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery<CollectionGame[], Error>({
    queryKey: queryKeys.otherUserGames(userId, filters),
    queryFn: async ({ pageParam }) => {
      if (!userId) {
        throw new Error('ID utilisateur requis');
      }

      const pageSize = 30;
      const offset = (pageParam as number) * pageSize;

      // Construire les paramètres de requête
      const searchParams = new URLSearchParams({
        offset: offset.toString(),
        limit: pageSize.toString(),
      });

      if (filters?.console_id && filters.console_id !== 'all') {
        searchParams.set('console_id', filters.console_id);
      }
      if (filters?.genre_id && filters.genre_id !== 'all') {
        searchParams.set('genre_id', filters.genre_id);
      }
      if (filters?.search && filters.search.trim()) {
        searchParams.set('search', filters.search.trim());
      }
      if (filters?.status && filters.status !== 'all') {
        searchParams.set('status', filters.status);
      }

      // Ajouter un timestamp pour forcer le bypass du cache
      const timestamp = Date.now();
      const response = await fetch(`/api/profiles/${userId}/games?${searchParams}&_t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Ce profil est privé');
        }
        if (response.status === 404) {
          throw new Error('Profil non trouvé');
        }
        throw new Error('Erreur lors de la récupération des jeux');
      }

      const data = await response.json();

      if (!data.games || data.games.length === 0) {
        return [];
      }

      // Transformer les données
      const formattedGames = data.games
        .map(transformUserGameItemSync)
        .filter(Boolean) as CollectionGame[];

      return formattedGames;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 30 ? allPages.length : undefined;
    },
    enabled: !!userId,
    ...collectionQueryOptions,
  });

  // Écouter les changements en temps réel pour invalider le cache
  useEffect(() => {
    if (!userId) return;

    // S'abonner aux changements sur user_games pour cet utilisateur
    const channel = supabase
      .channel(`user_games_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'user_games',
          filter: `user_id=eq.${userId}`,
        },
        async (_payload: any) => {
          // Invalider le cache et forcer un refetch immédiat
          await queryClient.invalidateQueries({ queryKey: queryKeys.otherUserGames(userId) });
          
          // Attendre un peu pour s'assurer que l'invalidation est propagée
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Forcer un refetch immédiat pour mettre à jour l'affichage
          await queryClient.refetchQueries({ 
            queryKey: queryKeys.otherUserGames(userId),
            type: 'active'
          });
        }
      )
      .subscribe((status: string) => {
        if (status === 'CHANNEL_ERROR') {
          console.error(`Erreur d'abonnement Realtime pour user_games de l'utilisateur ${userId}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return query;
}

// Hook pour récupérer les statistiques d'un autre utilisateur
export function useOtherUserGamesStats(userId: string | undefined, tab: string = 'collection') {
  const query = useQuery({
    queryKey: queryKeys.otherUserGamesStats(userId, tab),
    queryFn: async () => {
      if (!userId) {
        throw new Error('ID utilisateur requis');
      }

      const result = await supabase.rpc('get_other_user_games_stats', {
        p_user_id: userId,
        p_tab: tab
      });

      if (result.error) {
        console.error('Stats RPC error:', result.error);
        throw new Error('Service de statistiques non disponible');
      }

      // Transformer les données RPC
      const stats = result.data?.[0];
      if (!stats) {
        throw new Error('Aucune statistique trouvée');
      }

      return {
        totalGames: stats.total_games || 0,
        consoles: stats.consoles || [],
        genres: stats.genres || []
      };
    },
    enabled: !!userId,
    ...collectionQueryOptions,
  });

  // Écouter les changements en temps réel
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`user_games_stats_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_games',
          filter: `user_id=eq.${userId}`,
        },
        async (_payload: any) => {
          await queryClient.invalidateQueries({
            queryKey: queryKeys.otherUserGamesStats(userId)
          });
        }
      )
      .subscribe((status: string) => {
        if (status === 'CHANNEL_ERROR') {
          console.error(`Erreur d'abonnement Realtime pour stats de l'utilisateur ${userId}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return query;
}

