import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { transformUserGameItem, sortGamesByTitle } from '@/lib/game-utils';
import { CollectionGame } from './useUserGames';
import { supabase } from '@/lib/supabase';

export function useOtherUserGames(userId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery<CollectionGame[], Error>({
    queryKey: ['otherUserGames', userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error('ID utilisateur requis');
      }
      
      // Ajouter un timestamp pour forcer le bypass du cache
      const timestamp = Date.now();
      const response = await fetch(`/api/profiles/${userId}/games?_t=${timestamp}`, {
        cache: 'no-store', // Ne pas utiliser le cache HTTP pour avoir les données les plus récentes
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
        .map(transformUserGameItem)
        .filter(Boolean) as CollectionGame[];
      
      // Trier par ordre alphabétique
      return sortGamesByTitle(formattedGames);
    },
    enabled: !!userId,
    staleTime: 0, // Les données sont immédiatement considérées comme périmées pour permettre un refetch après invalidation
    gcTime: 1000 * 60 * 60, // Garder en cache 1 heure après inactivité
    refetchOnMount: true, // Rafraîchir au montage pour avoir les données les plus récentes
    refetchOnWindowFocus: false, // Ne pas rafraîchir au focus (Realtime gère les mises à jour)
    refetchOnReconnect: true, // Rafraîchir à la reconnexion pour synchroniser
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
        async (payload) => {
          // Invalider le cache et forcer un refetch immédiat
          // Invalider d'abord
          await queryClient.invalidateQueries({ queryKey: ['otherUserGames', userId] });
          
          // Attendre un peu pour s'assurer que l'invalidation est propagée
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Forcer un refetch immédiat pour mettre à jour l'affichage
          await queryClient.refetchQueries({ 
            queryKey: ['otherUserGames', userId],
            type: 'active' // Seulement refetch les queries actives
          });
        }
      )
      .subscribe((status) => {
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

