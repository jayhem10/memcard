import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { transformUserGameItem, sortGamesByTitle } from '@/lib/game-utils';
import { useAuth } from '@/context/auth-context';

export type CollectionGame = {
  id: string;
  igdb_id: number;
  title: string;
  release_date: string | null;
  developer: string;
  publisher: string;
  description_en: string;
  description_fr: string | null;
  cover_url: string | null;
  console_id: string;
  console_name?: string;
  genres: Array<{ id: string; name: string }>;
  status?: string;
  rating?: number | null;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  purchase_date?: string | null;
  play_time?: number | null;
  completion_percentage?: number | null;
  buy_price?: number | null;
  edition?: string | null;
  edition_other?: string | null;
};

export function useUserGames() {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const query = useQuery<CollectionGame[], Error>({
    queryKey: ['userGames', user?.id],
    queryFn: async () => {
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }
      
      // Fetch user's games with a join to get console information
      const { data, error } = await supabase
        .from('user_games')
        .select(`
          id,
          game_id,
          status,
          rating,
          notes,
          created_at,
          updated_at,
          purchase_date,
          play_time,
          completion_percentage,
          buy_price,
          buy,
          edition,
          edition_other,
          games:game_id(id, igdb_id, title, release_date, developer, publisher, description_en, description_fr, cover_url, console_id, consoles:console_id(id, name), game_genres(genre_id, genres(id, name)))
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erreur lors de la récupération des jeux:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        return [];
      }
      
      // Transformer les données
      const formattedGames = data
        .map(transformUserGameItem)
        .filter(Boolean) as CollectionGame[];
      
      // Trier par ordre alphabétique
      return sortGamesByTitle(formattedGames);
    },
    enabled: !!user && !authLoading,
    staleTime: 0, // Les données sont immédiatement considérées comme périmées après invalidation
    refetchOnMount: true, // Rafraîchir au montage pour avoir les données les plus récentes
    refetchOnWindowFocus: true, // Rafraîchir au focus de la fenêtre
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
        async (payload) => {
          // Invalider le cache et forcer un refetch immédiat
          await queryClient.invalidateQueries({ queryKey: ['userGames', user.id] });
          
          // Attendre un peu pour s'assurer que l'invalidation est propagée
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Forcer un refetch immédiat même si la query n'est pas active
          await queryClient.refetchQueries({ 
            queryKey: ['userGames', user.id],
            type: 'all' // Refetch même si la query n'est pas active
          });
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error(`Erreur d'abonnement Realtime pour user_games de l'utilisateur ${user.id}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return query;
}

